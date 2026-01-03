"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ref, onValue, set, off, runTransaction } from "firebase/database";
import { database } from "@/lib/firebase";
import { GameState, GameEvent } from "@/types/game";
import { initialGame } from "@/lib/gameUtils";
import { applyEvent } from "@/lib/gameEvents";
import { sendEventToDiscord } from "@/lib/discordWebhook";

/**
 * Custom hook for real-time game state synchronization with Firebase
 * Uses Firebase transactions to prevent race conditions and ensure atomic operations
 */
export function useGameSync(gameId: string = "main", enabled: boolean = true) {
  const [game, setGame] = useState<GameState>(initialGame());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track pending events to avoid duplicate processing and implement queuing
  const pendingEvents = useRef<Set<string>>(new Set());
  const eventQueue = useRef<Array<{ event: GameEvent; resolve: () => void; reject: (err: Error) => void }>>([]); 
  const processingEvent = useRef(false);
  const isInitialized = useRef(false);
  const optimisticState = useRef<GameState | null>(null);
  const lastServerTimestamp = useRef<number>(0);

  // Load game state from Firebase
  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    const gameRef = ref(database, `games/${gameId}`);

    const handleValue = (snapshot: any) => {
      try {
        const data = snapshot.val();
        if (data) {
          // Only update if we don't have a pending optimistic update in progress
          if (!processingEvent.current) {
            setGame(data);
            lastServerTimestamp.current = Date.now();
          }
          isInitialized.current = true;
        } else if (!isInitialized.current) {
          // Initialize game if it doesn't exist
          const initial = initialGame();
          set(gameRef, initial).catch((err) => {
            console.error("Failed to initialize game:", err);
            setError("Failed to initialize game");
          });
          setGame(initial);
          isInitialized.current = true;
        }
        setLoading(false);
      } catch (err) {
        console.error("Error loading game:", err);
        setError("Failed to load game state");
        setLoading(false);
      }
    };

    onValue(gameRef, handleValue, (err) => {
      console.error("Firebase error:", err);
      setError("Connection error");
      setLoading(false);
    });

    return () => {
      off(gameRef, "value", handleValue);
    };
  }, [gameId, enabled]);

  /**
   * Process the event queue sequentially
   */
  const processEventQueue = useCallback(async () => {
    if (processingEvent.current || eventQueue.current.length === 0) {
      return;
    }

    processingEvent.current = true;
    const { event, resolve, reject } = eventQueue.current[0];
    let validationReason: string | null = null;

    try {
      const gameRef = ref(database, `games/${gameId}`);
      
      let optimisticNewState: GameState | null = null;
      
      // Use Firebase transaction for atomic operation
      const result = await runTransaction(gameRef, (currentData): GameState | undefined => {
        if (currentData === null) {
          // Initialize if doesn't exist
          return initialGame();
        }

        // Validate event preconditions
        const validationResult = validateEvent(currentData, event);
        if (!validationResult.valid) {
          validationReason = validationResult.reason || null;
          console.warn("Event validation failed:", validationResult.reason, "Event:", event);
          // Abort transaction by returning undefined
          return undefined;
        }

        // Apply event to current state
        const newState = applyEvent(currentData, event);
        optimisticNewState = newState;
        return newState;
      }, {
        applyLocally: true, // Let Firebase apply optimistically for faster UI
      });

      if (result.committed && optimisticNewState) {
        // Transaction succeeded - update state and clear optimistic flag
        setGame(optimisticNewState);
        optimisticState.current = null;
        lastServerTimestamp.current = Date.now();
        
        // Send event to Discord (async, non-blocking) with game state for team name lookup
        sendEventToDiscord(event, optimisticNewState as GameState).catch(err => 
          console.error("Discord webhook failed:", err)
        );
        
        resolve();
      } else {
        // Transaction aborted (validation failed or conflict) - rollback optimistic update
        optimisticState.current = null;
        // Force refresh from server to get correct state
        const snapshot = await result.snapshot;
        if (snapshot.val()) {
          setGame(snapshot.val());
        }
        reject(new Error(validationReason || "Event validation failed or conflict detected"));
      }

      // Remove processed event from queue
      eventQueue.current.shift();
      processingEvent.current = false;

      // Process next event in queue
      if (eventQueue.current.length > 0) {
        setTimeout(() => processEventQueue(), 0);
      }
    } catch (err) {
      console.error("Failed to process event:", err);
      optimisticState.current = null;
      reject(err as Error);
      eventQueue.current.shift();
      processingEvent.current = false;

      // Continue processing queue even if one event fails
      if (eventQueue.current.length > 0) {
        setTimeout(() => processEventQueue(), 0);
      }
    }
  }, [gameId]);

  /**
   * Validate if an event can be applied to the current game state
   * Prevents invalid operations (e.g., claiming already-claimed powerup)
   */
  const validateEvent = (currentGame: GameState, event: GameEvent): { valid: boolean; reason?: string } => {
    try {
      switch (event.type) {
        case "CLAIM_POWERUP_TILE": {
          const tile = currentGame.powerupTiles.find((pt) => pt.id === Number(event.powerTileId));
          const team = currentGame.teams.find((t) => t.id === event.teamId);
          
          if (!tile || !team) {
            return { valid: false, reason: "Tile or team not found" };
          }

          if (tile.claimType === "firstTeam") {
            const anyTeamClaimed = currentGame.teams.some((t) =>
              (t.claimedPowerupTiles || []).includes(Number(tile.id))
            );
            if (anyTeamClaimed) {
              return { valid: false, reason: "Already claimed by another team" };
            }
          } else if (tile.claimType === "eachTeam") {
            const alreadyClaimed = (team.claimedPowerupTiles || []).includes(tile.id);
            if (alreadyClaimed) {
              return { valid: false, reason: "Already claimed by this team" };
            }
          }
          break;
        }

        case "USE_POWERUP": {
          const team = currentGame.teams.find((t) => t.id === event.teamId);
          if (!team) {
            return { valid: false, reason: "Team not found" };
          }

          const inventory = team.inventory || [];
          if (!inventory.includes(event.powerupId)) {
            return { valid: false, reason: `Team doesn't have this powerup (has: ${inventory.join(", ")})` };
          }

          // Check cooldown
          if (team.powerupCooldown > 0 && event.powerupId !== "clearCooldown") {
            return { valid: false, reason: `Powerup cooldown is active (${team.powerupCooldown} tile${team.powerupCooldown !== 1 ? 's' : ''} remaining). Complete more tiles or use 'Clear Cooldown' powerup.` };
          }

          // Validate changeTile hasn't already been used on this tile
          if (event.powerupId === "changeTile" && event.futureTile) {
            const changedTiles = new Set(currentGame.changedTiles || []);
            if (changedTiles.has(Number(event.futureTile))) {
              return { valid: false, reason: "Tile already changed" };
            }
          }

          // Validate copypaste target tile
          if (event.powerupId === "copypaste" && event.futureTile) {
            const tileN = Number(event.futureTile);
            const copyPasteTiles = new Set(currentGame.copyPasteTiles || []);
            if (copyPasteTiles.has(tileN)) {
              return { valid: false, reason: "Tile already copied to" };
            }
          }

          // Validate double tile hasn't already been doubled
          if (
            (event.powerupId === "doubleEasy" ||
              event.powerupId === "doubleMedium" ||
              event.powerupId === "doubleHard") &&
            event.futureTile
          ) {
            const doubledTilesInfo = currentGame.doubledTilesInfo || {};
            if (doubledTilesInfo[Number(event.futureTile)]) {
              return { valid: false, reason: "Tile already doubled" };
            }
          }
          break;
        }

        case "COMPLETE_TILE": {
          const team = currentGame.teams.find((t) => t.id === event.teamId);
          if (!team) {
            return { valid: false, reason: "Team not found" };
          }
          // Additional validations can be added here
          break;
        }
      }

      return { valid: true };
    } catch (err) {
      return { valid: false, reason: "Validation error" };
    }
  };

  /**
   * Dispatch an event to modify game state
   * Events are queued and processed sequentially using Firebase transactions
   */
  const dispatch = useCallback(
    async (event: GameEvent) => {
      if (!isInitialized.current) {
        console.warn("Game not initialized yet");
        return Promise.reject(new Error("Game not initialized"));
      }

      // Generate unique event ID to prevent duplicates
      const eventId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      if (pendingEvents.current.has(eventId)) {
        return Promise.reject(new Error("Duplicate event"));
      }
      
      pendingEvents.current.add(eventId);

      // Add to queue and return promise
      return new Promise<void>((resolve, reject) => {
        eventQueue.current.push({
          event,
          resolve: () => {
            pendingEvents.current.delete(eventId);
            resolve();
          },
          reject: (err) => {
            pendingEvents.current.delete(eventId);
            reject(err);
          },
        });

        // Start processing queue
        processEventQueue();
      });
    },
    [gameId, processEventQueue]
  );

  /**
   * Reset the game to initial state
   */
  const resetGame = useCallback(async () => {
    const event: GameEvent = { type: "RESET_ALL" };
    await dispatch(event);
  }, [dispatch]);

  return {
    game,
    loading,
    error,
    dispatch,
    resetGame,
  };
}

/**
 * Hook for local-only game state (no Firebase sync)
 * Useful for testing or offline mode
 */
export function useLocalGame() {
  const [game, setGame] = useState<GameState>(initialGame());

  const dispatch = useCallback(
    (event: GameEvent) => {
      const newState = applyEvent(game, event);
      setGame(newState);
    },
    [game]
  );

  const resetGame = useCallback(() => {
    setGame(initialGame());
  }, []);

  return {
    game,
    loading: false,
    error: null,
    dispatch,
    resetGame,
  };
}
