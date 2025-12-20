import {
  GameState,
  GameEvent,
  MAX_TILE,
  Team,
  RaceTile,
} from "@/types/game";
import {
  initialGame,
  addLog,
  uid,
  clamp,
  colorForIndex,
  getRaceTile,
  tileLabel,
  tileDiff,
  tileReward,
  tileDesc,
  simulateAdvance,
  maybeGrantMainTileReward,
  powerupLabel,
} from "./gameUtils";

const MAX_HISTORY_SIZE = 50; // Limit history to prevent memory issues

/**
 * Save current state to history before applying event
 */
function saveToHistory(game: GameState): GameState {
  const history = game.eventHistory || [];
  
  // Create a snapshot without the history to avoid nested history
  const { eventHistory, ...stateSnapshot } = game;
  
  // Add to history and limit size
  const newHistory = [...history, stateSnapshot].slice(-MAX_HISTORY_SIZE);
  
  return { ...game, eventHistory: newHistory };
}

/**
 * Core event handler - applies an event to the game state
 * This is a pure function that returns a new game state
 */
export function applyEvent(game: GameState, event: GameEvent): GameState {
  // Save to history before applying event (except for ADMIN_UNDO and RESET_ALL)
  const shouldSaveHistory = event.type !== "ADMIN_UNDO" && event.type !== "RESET_ALL";
  const gameWithHistory = shouldSaveHistory ? saveToHistory(game) : game;
  
  try {
    return applyEventInternal(gameWithHistory, event);
  } catch (error) {
    console.error("Error applying event:", error);
    return game;
  }
}

/**
 * Internal event handler - actual event processing logic
 */
function applyEventInternal(game: GameState, event: GameEvent): GameState {
  try {
    switch (event.type) {
      case "RESET_ALL": {
        return addLog(initialGame(), "Game reset.");
      }

      case "ADD_TEAM": {
        if (!event.adminName) return game;
        const name = (event.name || "").trim();
        if (!name) return game;

        const idx = game?.teams?.length || 0;
        const team = {
          id: uid(),
          name,
          color: colorForIndex(idx),
          pos: 1,
          createdAt: Date.now(),
          inventory: [],
          preCleared: [],
          copyChoice: [],
          claimedRaceTileRewards: [],
          claimedPowerupTiles: [],
          members: [],
          captain: "",
          playerPoints: {},
          powerupCooldown: false,
          password: null,
        };

        let next = { ...game, teams: [...(game.teams || []), team] };
        next = addLog(
          next,
          `Admin created team "${name}". Password must be set by admin before team can be used.`
        );
        return next;
      }

      case "REMOVE_TEAM": {
        const team = game.teams.find((t) => t.id === event.teamId);
        const teams = game.teams.filter((t) => t.id !== event.teamId);
        let next = { ...game, teams };
        next = addLog(next, `Team removed: ${team?.name ?? "(unknown)"}`);
        return next;
      }

      case "SET_TEAM_PASSWORD": {
        const teams = game.teams.map((t) =>
          t.id === event.teamId ? { ...t, password: event.password } : t
        );
        let next = { ...game, teams };
        next = addLog(next, `Password set for team ID ${event.teamId}`, event.adminName);
        return next;
      }

      case "ADMIN_APPLY_DRAFT_TEAMS": {
        const payloadTeams = Array.isArray(event.teams) ? event.teams : [];
        if (payloadTeams.length === 0) return game;

        // Keep existing teams if name matches, otherwise create new
        let nextTeams = [...(game.teams || [])];

        function ensureTeam(teamName: string, indexHint: number) {
          const existing = nextTeams.find((t) => t.name.toLowerCase() === teamName.toLowerCase());
          if (existing) return existing;
          const team: Team = {
            id: uid(),
            name: teamName,
            color: colorForIndex(nextTeams.length + indexHint),
            pos: 1,
            createdAt: Date.now(),
            inventory: [],
            preCleared: [],
            copyChoice: [],
            claimedRaceTileRewards: [],
            claimedPowerupTiles: [],
            members: [],
            captain: "",
            playerPoints: {},
            powerupCooldown: false,
            password: null,
          };
          nextTeams = [...nextTeams, team];
          return team;
        }

        for (let i = 0; i < payloadTeams.length; i++) {
          const pt = payloadTeams[i];
          const name = (pt.name || "").trim();
          if (!name) continue;

          const team = ensureTeam(name, i);
          // Update members/captain
          nextTeams = nextTeams.map((t) =>
            t.id === team.id ? { ...t, members: pt.members || [], captain: pt.captain || "" } : t
          );
        }

        let next = { ...game, teams: nextTeams };
        next = addLog(next, `Draft applied: ${payloadTeams.length} team(s) updated.`, event.adminName);
        return next;
      }

      case "COMPLETE_TILE": {
        const team = game.teams.find((t) => t.id === event.teamId);
        if (!team) return game;

        const completedTile = team.pos;
        const playerNames = event.playerNames || ["(unknown)"];
        const completedLabel = tileLabel(game, completedTile);

        const rt = getRaceTile(game, completedTile);
        const minRequired = rt.minCompletions || 1;

        if (playerNames.length < minRequired) {
          // Can't silently fail in pure function, log it
          return addLog(
            game,
            `${team.name} attempted to complete tile ${completedTile} with insufficient players (need ${minRequired}, got ${playerNames.length})`
          );
        }

        const nextPos = simulateAdvance(team, 1);
        const teams = game.teams.map((t) =>
          t.id === event.teamId ? { ...t, pos: nextPos, powerupCooldown: false } : t
        );
        let next = { ...game, teams };

        // Update revealed tiles
        const revealedTiles = new Set(game.revealedTiles || []);
        const CHUNK_SIZE = 8;

        if (completedTile === MAX_TILE - 1) {
          revealedTiles.add(MAX_TILE);
        }

        const oldChunk = Math.floor((completedTile - 1) / CHUNK_SIZE);
        const newChunk = Math.floor((nextPos - 1) / CHUNK_SIZE);

        for (let chunk = oldChunk + 1; chunk <= newChunk; chunk++) {
          const chunkStart = chunk * CHUNK_SIZE + 1;
          const chunkEnd = Math.min((chunk + 1) * CHUNK_SIZE, MAX_TILE - 1);
          for (let i = chunkStart; i <= chunkEnd; i++) {
            revealedTiles.add(i);
          }
        }

        next = { ...next, revealedTiles: Array.from(revealedTiles) };

        const rewardRes = maybeGrantMainTileReward(next, event.teamId, completedTile);
        next = rewardRes.game;

        // Scoring
        const diff = tileDiff(game, completedTile);
        const rtScoring = getRaceTile(next, completedTile);
        const doubledTilesInfoScoring = next.doubledTilesInfo || {};
        const isDoubledWithDiffPoints =
          doubledTilesInfoScoring[completedTile]?.useDifficultyPoints || false;
        const isMultiCompletion = Math.max(1, Number(rtScoring.maxCompletions || 1)) > 1;
        const pointsForDiff =
          isMultiCompletion && !isDoubledWithDiffPoints
            ? 1
            : diff === 1
            ? 1
            : diff === 2
            ? 2
            : 3;

        const playerPoints = { ...(next.playerPoints || {}) };
        playerNames.forEach((playerName) => {
          playerPoints[playerName] = (playerPoints[playerName] || 0) + pointsForDiff;
        });
        next = { ...next, playerPoints };

        const playersText = playerNames.join(", ");
        const totalPoints = pointsForDiff * playerNames.length;
        const isDoubledTile = doubledTilesInfoScoring[completedTile] ? true : false;
        const doubledText = isDoubledTile ? "doubled " : "";

        if (completedTile === MAX_TILE) {
          next = addLog(
            next,
            `🏆🎉 ${team.name} completed the ${doubledText}Final Tile! ${playersText} are the WINNERS! 🏆🎉 (+${pointsForDiff} pts each, ${totalPoints} total)${
              rewardRes.granted ? ` 🎁 Reward gained: ${powerupLabel(rewardRes.granted)}` : ""
            }`
          );
        } else if (nextPos === completedTile) {
          next = addLog(
            next,
            `${team.name}, ${playersText} completed ${tileDesc(
              next,
              completedTile
            )} (already at finish) +${totalPoints}pts total → Current: ${tileDesc(next, nextPos)}`
          );
        } else {
          next = addLog(
            next,
            `${team.name}, ${playersText} completed ${doubledText}Tile ${completedTile}: "${completedLabel}" (+${pointsForDiff} pts each, ${totalPoints} total) → Current: ${tileDesc(
              next,
              nextPos
            )}${rewardRes.granted ? ` 🎁 Reward gained: ${powerupLabel(rewardRes.granted)}` : ""}`
          );
        }
        return next;
      }

      case "USE_COPY_CHOICE": {
        const team = game.teams.find((t) => t.id === event.teamId);
        if (!team) return game;

        const here = team.pos;
        const stamp = (team.copyChoice || []).find((x) => x.tile === here);
        if (!stamp) return game;

        const dest = clamp(here + 1, 1, MAX_TILE);

        let teams = game.teams.map((t) => {
          if (t.id !== event.teamId) return t;
          return {
            ...t,
            pos: dest,
            copyChoice: (t.copyChoice || []).filter((x) => x.tile !== here),
            powerupCooldown: false,
          };
        });

        let next = { ...game, teams };
        const rewardRes = maybeGrantMainTileReward(next, event.teamId, here);
        next = rewardRes.game;

        const fromPart = stamp.fromTile
          ? ` (stamp created from ${tileDesc(next, stamp.fromTile)})`
          : "";
        next = addLog(
          next,
          `${team.name} used copy-choice at ${tileDesc(next, here)}${fromPart} → Current: ${tileDesc(
            next,
            dest
          )}${rewardRes.granted ? ` 🎁 Reward gained: ${powerupLabel(rewardRes.granted)}` : ""}`
        );
        return next;
      }

      case "CLAIM_POWERUP_TILE": {
        const team = game.teams.find((t) => t.id === event.teamId);
        const tile = game.powerupTiles.find((pt) => pt.id === Number(event.powerTileId));
        if (!team || !tile || !tile.rewardPowerupId) return game;

        const playerNames = event.playerNames || [];
        const minRequired = tile.minCompletions || 1;

        if (playerNames.length < minRequired) {
          return addLog(
            game,
            `${team.name} attempted to claim powerup ${tile.label} with insufficient players (need ${minRequired}, got ${playerNames.length})`
          );
        }

        const claimType = tile.claimType || "eachTeam";

        if (claimType === "eachTeam") {
          const alreadyClaimed = (team.claimedPowerupTiles || []).includes(tile.id);
          if (alreadyClaimed) {
            return addLog(game, `${team.name} already claimed powerup ${tile.label}`);
          }
        } else if (claimType === "firstTeam") {
          const tileId = Number(tile.id);
          const anyTeamClaimed = game.teams.some((t) =>
            (t.claimedPowerupTiles || []).includes(tileId)
          );
          if (anyTeamClaimed) {
            return addLog(game, `Powerup ${tile.label} already claimed by another team`);
          }
        }

        const pointsPerCompletion = tile.pointsPerCompletion || 1;
        const playerPoints = { ...(game.playerPoints || {}) };
        playerNames.forEach((playerName) => {
          playerPoints[playerName] = (playerPoints[playerName] || 0) + pointsPerCompletion;
        });

        const teams = game.teams.map((t) => {
          if (t.id !== team.id) return t;
          const tileId = Number(tile.id);
          return {
            ...t,
            inventory: [...(t.inventory || []), tile.rewardPowerupId],
            claimedPowerupTiles: [...(t.claimedPowerupTiles || []), tileId],
          };
        });

        let next = { ...game, teams, playerPoints };
        const playerList = playerNames.join(", ");
        next = addLog(
          next,
          `${team.name} completed "${tile.label}" (${playerList}: +${pointsPerCompletion}pts each) → gained ${powerupLabel(
            tile.rewardPowerupId
          )}.`
        );
        return next;
      }

      case "USE_POWERUP": {
        const { teamId, powerupId, targetId, futureTile, changeTaskId, targetPowerupId } =
          event;
        const team = game.teams.find((t) => t.id === teamId);
        if (!team) return game;
        if (!(team.inventory || []).includes(powerupId)) {
          return addLog(game, `${team.name} does not have that powerup stored.`);
        }

        if (team.powerupCooldown && powerupId !== "clearCooldown") {
          return addLog(
            game,
            `${team.name} tried to use ${powerupLabel(
              powerupId
            )} but is on powerup cooldown.`
          );
        }

        const consumePowerup = (gameState: GameState) => {
          const teamsConsumed = gameState.teams.map((t) => {
            if (t.id !== teamId) return t;
            const nextInv = [...(t.inventory || [])];
            const i = nextInv.indexOf(powerupId);
            if (i >= 0) nextInv.splice(i, 1);
            return { ...t, inventory: nextInv, powerupCooldown: true };
          });
          return { ...gameState, teams: teamsConsumed };
        };

        // Skip powerups
        if (powerupId === "skip1" || powerupId === "skip2" || powerupId === "skip3") {
          const steps = powerupId === "skip1" ? 1 : powerupId === "skip2" ? 2 : 3;
          const before = team.pos;
          const dest = simulateAdvance(team, steps);

          if (dest >= MAX_TILE) {
            return addLog(
              game,
              `${team.name} tried to use ${powerupLabel(
                powerupId
              )} but it would skip the final tile.`
            );
          }

          let next = consumePowerup(game);
          const teams = next.teams.map((t) => (t.id === teamId ? { ...t, pos: dest } : t));
          next = { ...next, teams };
          next = addLog(
            next,
            `${team.name} used ${powerupLabel(powerupId)} (from ${tileDesc(
              next,
              before
            )} → Current: ${tileDesc(next, dest)})`
          );
          return next;
        }

        // Back powerups
        if (powerupId === "back1" || powerupId === "back2" || powerupId === "back3") {
          const amount = powerupId === "back1" ? 1 : powerupId === "back2" ? 2 : 3;
          const target = game.teams.find((t) => t.id === targetId);
          if (!target || target.id === teamId) {
            return addLog(
              game,
              `${team.name} tried to use ${powerupLabel(powerupId)} but no valid target.`
            );
          }
          const before = target.pos;
          const dest = clamp(target.pos - amount, 1, MAX_TILE);
          let next = consumePowerup(game);
          const teams = next.teams.map((t) =>
            t.id === target.id ? { ...t, pos: dest, powerupCooldown: true } : t
          );
          next = { ...next, teams };
          next = addLog(
            next,
            `${team.name} used ${powerupLabel(powerupId)} on ${target.name} (from ${tileDesc(
              next,
              before
            )} → Current: ${tileDesc(next, dest)})`
          );
          return next;
        }

        // Copy-paste powerup
        if (powerupId === "copypaste") {
          const tileN = Number(futureTile);
          if (!Number.isFinite(tileN) || tileN < 2 || tileN > MAX_TILE || tileN === team.pos) {
            return addLog(game, `Invalid tile for copypaste.`);
          }

          const destTile = getRaceTile(game, tileN);
          if (destTile.rewardPowerupId) {
            return addLog(
              game,
              `${team.name} cannot copy to Tile ${tileN} because it has a reward powerup.`
            );
          }

          const teamOnTile = (game.teams || []).some((t) => t.pos === tileN);
          if (teamOnTile) {
            return addLog(
              game,
              `${team.name} cannot copy to Tile ${tileN} because a team is standing on it.`
            );
          }

          const sourceTile = getRaceTile(game, team.pos);
          const sourceDiff = tileDiff(game, team.pos);
          const destDiff = tileDiff(game, tileN);

          if (destDiff > sourceDiff) {
            return addLog(
              game,
              `${team.name} tried to copy to Tile ${tileN} but it's higher difficulty.`
            );
          }

          const beforeLabel = tileLabel(game, tileN);
          let next = consumePowerup(game);

          const raceTiles = next.raceTiles.map((rt) =>
            rt.n === tileN
              ? {
                  ...rt,
                  label: sourceTile.label,
                  instructions: sourceTile.instructions || "",
                  image: sourceTile.image || "",
                  maxCompletions: sourceTile.maxCompletions || 1,
                  difficulty: sourceTile.difficulty || 1,
                }
              : rt
          );
          next = { ...next, raceTiles };

          const teams = next.teams.map((t) => {
            if (t.id !== teamId) return t;
            const entry = { tile: tileN, fromTile: team.pos };
            const key = `${entry.tile}|${entry.fromTile}`;
            const existing = new Set(
              (t.copyChoice || []).map((x) => `${x.tile}|${x.fromTile ?? ""}`)
            );
            if (existing.has(key)) return t;
            return { ...t, copyChoice: [...(t.copyChoice || []), entry] };
          });
          next = { ...next, teams };
          next = addLog(
            next,
            `${team.name} used ${powerupLabel(
              powerupId
            )} (Tile ${tileN}: "${beforeLabel}" → "${sourceTile.label}" from ${tileDesc(
              next,
              team.pos
            )}).`
          );
          return next;
        }

        // Change tile powerup
        if (powerupId === "changeTile") {
          const tileN = Number(futureTile);
          if (!Number.isFinite(tileN) || tileN < 2 || tileN > MAX_TILE) {
            return addLog(game, `Invalid tile number for changeTile.`);
          }

          if (tileN === MAX_TILE) {
            return addLog(
              game,
              `${team.name} tried to change the final tile, but it cannot be changed.`
            );
          }

          const teamOnTile = (game.teams || []).some((t) => t.pos === tileN);
          if (teamOnTile) {
            return addLog(
              game,
              `${team.name} cannot change Tile ${tileN} because a team is standing on it.`
            );
          }

          const changedTiles = new Set(game.changedTiles || []);
          if (changedTiles.has(tileN)) {
            return addLog(
              game,
              `${team.name} tried to change Tile ${tileN}, but it has already been changed.`
            );
          }

          const diff = tileDiff(game, tileN);
          const poolAll = game.taskPools?.[String(diff)] || [];
          const used = new Set(game.usedPoolTaskIds || []);
          const poolUnused = poolAll.filter((x) => !used.has(x.id));
          const chosen = poolUnused.find((x) => x.id === changeTaskId);
          if (!chosen) {
            return addLog(
              game,
              `${team.name} must pick an UNUSED replacement task from difficulty ${diff} pool.`
            );
          }

          const beforeLabel = tileLabel(game, tileN);
          const normalize = (str: string) =>
            (str || "").trim().toLowerCase().replace(/\s+/g, " ");
          const beforeLabelNormalized = normalize(beforeLabel);
          const oldTaskId = poolAll.find(
            (x) => normalize(x.label) === beforeLabelNormalized
          )?.id;

          let next = consumePowerup(game);

          const raceTiles = next.raceTiles.map((rt) =>
            rt.n === tileN
              ? {
                  ...rt,
                  label: chosen.label,
                  instructions: chosen.instructions || "",
                  image: chosen.image || "",
                }
              : rt
          );
          const usedPoolTaskIds = Array.from(
            new Set([...(next.usedPoolTaskIds || []), chosen.id, ...(oldTaskId ? [oldTaskId] : [])])
          );
          const changedTilesArr = Array.from(
            new Set([...(next.changedTiles || []), tileN])
          );

          next = { ...next, raceTiles, usedPoolTaskIds, changedTiles: changedTilesArr };
          next = addLog(
            next,
            `${team.name} used ${powerupLabel(powerupId)} on Tile ${tileN} (D${diff}) → "${beforeLabel}" → "${
              chosen.label
            }".`
          );
          return next;
        }

        // Clear cooldown
        if (powerupId === "clearCooldown") {
          let next = consumePowerup(game);
          const teams = next.teams.map((t) =>
            t.id === teamId ? { ...t, powerupCooldown: false } : t
          );
          next = { ...next, teams };
          next = addLog(
            next,
            `${team.name} used ${powerupLabel(powerupId)} → cooldown cleared.`
          );
          return next;
        }

        // Disable powerup
        if (powerupId === "disablePowerup") {
          const target = game.teams.find((t) => t.id === targetId);
          if (!target || target.id === teamId || !targetPowerupId) {
            return addLog(
              game,
              `${team.name} tried to use ${powerupLabel(powerupId)} but invalid target.`
            );
          }
          if (!(target.inventory || []).includes(targetPowerupId)) {
            return addLog(
              game,
              `${team.name} tried to disable a powerup from ${target.name} but target doesn't have it.`
            );
          }
          let next = consumePowerup(game);
          const teams = next.teams.map((t) => {
            if (t.id !== target.id) return t;
            const nextInv = [...(t.inventory || [])];
            const i = nextInv.indexOf(targetPowerupId);
            if (i >= 0) nextInv.splice(i, 1);
            return { ...t, inventory: nextInv };
          });
          next = { ...next, teams };
          next = addLog(
            next,
            `${team.name} used ${powerupLabel(powerupId)} on ${
              target.name
            } → removed ${powerupLabel(targetPowerupId)}.`
          );
          return next;
        }

        // Double powerup
        if (powerupId === "doublePowerup") {
          if (!targetPowerupId || !(team.inventory || []).includes(targetPowerupId)) {
            return addLog(game, `${team.name} tried to double a powerup they don't have.`);
          }
          let next = consumePowerup(game);
          const teams = next.teams.map((t) => {
            if (t.id !== teamId) return t;
            return { ...t, inventory: [...(t.inventory || []), targetPowerupId] };
          });
          next = { ...next, teams };
          next = addLog(
            next,
            `${team.name} used ${powerupLabel(powerupId)} → doubled ${powerupLabel(
              targetPowerupId
            )}.`
          );
          return next;
        }

        // Double tile
        if (
          powerupId === "doubleEasy" ||
          powerupId === "doubleMedium" ||
          powerupId === "doubleHard"
        ) {
          const tileN = Number(futureTile);
          if (!Number.isFinite(tileN) || tileN < 1 || tileN > MAX_TILE) {
            return addLog(
              game,
              `${team.name} tried to double a tile but provided invalid tile number.`
            );
          }

          if (tileN === MAX_TILE) {
            return addLog(
              game,
              `${team.name} tried to double the final tile, but it cannot be doubled.`
            );
          }

          const targetDiff =
            powerupId === "doubleEasy" ? 1 : powerupId === "doubleMedium" ? 2 : 3;
          const tileDifficulty = tileDiff(game, tileN);

          if (tileDifficulty !== targetDiff) {
            return addLog(
              game,
              `${team.name} tried to use ${powerupLabel(
                powerupId
              )} on Tile ${tileN} but it's not the correct difficulty.`
            );
          }

          const teamOnTile = (game.teams || []).some((t) => t.pos === tileN);
          if (teamOnTile) {
            return addLog(
              game,
              `${team.name} cannot double Tile ${tileN} because a team is standing on it.`
            );
          }

          const doubledTilesInfo = game.doubledTilesInfo || {};
          if (doubledTilesInfo[tileN]) {
            return addLog(
              game,
              `${team.name} tried to double Tile ${tileN}, but it has already been doubled.`
            );
          }

          let next = consumePowerup(game);
          const originalTile = next.raceTiles.find((t) => t.n === tileN);
          const originalMaxCompletions = originalTile ? originalTile.maxCompletions : 1;
          const useDifficultyPoints = originalMaxCompletions === 1;

          const raceTiles = next.raceTiles.map((t) => {
            if (t.n !== tileN) return t;
            return {
              ...t,
              maxCompletions: t.maxCompletions * 2,
              minCompletions: (t.minCompletions || 1) * 2,
            };
          });
          const newDoubledTilesInfo = { ...doubledTilesInfo, [tileN]: { useDifficultyPoints } };
          const newDoubledTiles = [...(next.doubledTiles || []), tileN];
          next = {
            ...next,
            raceTiles,
            doubledTiles: newDoubledTiles,
            doubledTilesInfo: newDoubledTilesInfo,
          };
          const updatedTile = raceTiles.find((t) => t.n === tileN);
          next = addLog(
            next,
            `${team.name} used ${powerupLabel(powerupId)} on ${tileDesc(
              next,
              tileN
            )} → requirement doubled to ${updatedTile?.maxCompletions} (min: ${
              updatedTile?.minCompletions
            }).`
          );
          return next;
        }

        return game;
      }

      // Admin events
      case "ADMIN_EDIT_RACE_TILE": {
        const n = Number(event.n);
        if (!Number.isFinite(n) || n < 1 || n > MAX_TILE) return game;

        const label = (event.label || "").trim() || `Task ${n}`;
        const difficulty: 1 | 2 | 3 = (n === MAX_TILE ? 3 : clamp(Number(event.difficulty || 1), 1, 3)) as 1 | 2 | 3;
        const rewardPowerupId = event.rewardPowerupId ? event.rewardPowerupId : null;
        const instructions = (event.instructions || "").toString();
        const image = (event.image || "").toString();
        const maxCompletions = Math.max(1, Math.floor(Number(event.maxCompletions) || 1));
        const minCompletions = Math.max(
          1,
          Math.min(maxCompletions, Math.floor(Number(event.minCompletions) || 1))
        );

        const raceTiles = game.raceTiles.map((t) =>
          t.n === n
            ? {
                ...t,
                label,
                difficulty,
                rewardPowerupId,
                instructions,
                image,
                maxCompletions,
                minCompletions,
              }
            : t
        );
        let next = { ...game, raceTiles };
        next = addLog(next, `Tile ${n} admin-updated: "${label}"`);
        return next;
      }

      case "ADMIN_CREATE_POWERUP_TILE": {
        const label = (event.label || "").trim();
        const rewardPowerupId = event.rewardPowerupId || "";
        const instructions = (event.instructions || "").toString();
        const image = (event.image || "").toString();
        const pointsPerCompletion = Math.max(
          1,
          Math.floor(Number(event.pointsPerCompletion) || 1)
        );
        const maxCompletions = Math.max(1, Math.floor(Number(event.maxCompletions) || 1));
        const minCompletions = Math.max(
          1,
          Math.min(maxCompletions, Math.floor(Number(event.minCompletions) || 1))
        );
        const claimType = ["eachTeam", "firstTeam", "unlimited"].includes(event.claimType)
          ? event.claimType
          : "eachTeam";
        if (!label || !rewardPowerupId) return game;

        const maxId = (game.powerupTiles || []).reduce((m, t) => Math.max(m, t.id), 0);
        const id = maxId + 1;

        const powerupTiles = [
          ...(game.powerupTiles || []),
          {
            id,
            label,
            rewardPowerupId,
            instructions,
            image,
            link: image,
            pointsPerCompletion,
            maxCompletions,
            minCompletions,
            claimType,
          },
        ];
        let next = { ...game, powerupTiles };
        next = addLog(
          next,
          `Powerup created: P${id} "${label}" → reward ${powerupLabel(rewardPowerupId)}`
        );
        return next;
      }

      case "ADMIN_EDIT_POWERUP_TILE": {
        const id = Number(event.id);
        if (!Number.isFinite(id)) return game;

        const label = (event.label || "").trim() || `Powerup Task ${id}`;
        const rewardPowerupId = event.rewardPowerupId || "";
        const instructions = (event.instructions || "").toString();
        const image = (event.image || "").toString();
        const pointsPerCompletion = Math.max(
          1,
          Math.floor(Number(event.pointsPerCompletion) || 1)
        );
        const maxCompletions = Math.max(1, Math.floor(Number(event.maxCompletions) || 1));
        const minCompletions = Math.max(
          1,
          Math.min(maxCompletions, Math.floor(Number(event.minCompletions) || 1))
        );
        const claimType = ["eachTeam", "firstTeam", "unlimited"].includes(event.claimType)
          ? event.claimType
          : "eachTeam";

        const powerupTiles = (game.powerupTiles || []).map((t) => {
          if (t.id === id) {
            return {
              id: t.id,
              label,
              rewardPowerupId: rewardPowerupId || t.rewardPowerupId,
              instructions,
              image,
              link: image,
              pointsPerCompletion,
              maxCompletions,
              minCompletions,
              claimType,
            };
          }
          return t;
        });
        let next = { ...game, powerupTiles };
        next = addLog(next, `Powerup tile P${id} updated: "${label}"`);
        return next;
      }

      case "ADMIN_ADD_POOL_TASK": {
        const diff = String(clamp(Number(event.diff || 1), 1, 3));
        const text = (event.label || "").trim();
        if (!text) return game;
        const item = { id: uid(), label: text, instructions: "", image: "", used: false };
        const taskPools = {
          ...game.taskPools,
          [diff]: [...(game.taskPools?.[diff] || []), item],
        };
        let next = { ...game, taskPools };
        next = addLog(next, `Added possible task (diff ${diff}): "${text}"`);
        return next;
      }

      case "ADMIN_EDIT_POOL_TASK": {
        const diff = String(clamp(Number(event.diff || 1), 1, 3));
        const id = event.id;
        if (!id) return game;
        const label = (event.label || "").trim() || "";
        const instructions = (event.instructions || "").toString();
        const image = (event.image || "").toString();

        const pool = (game.taskPools?.[diff] || []).map((t) =>
          t.id === id ? { ...t, label, instructions, image } : t
        );
        const taskPools = { ...game.taskPools, [diff]: pool };
        let next = { ...game, taskPools };
        next = addLog(next, `Edited possible task (diff ${diff}): "${label}"`);
        return next;
      }

      case "ADMIN_REMOVE_POOL_TASK": {
        const diff = String(clamp(Number(event.diff || 1), 1, 3));
        const taskId = event.taskId;
        const taskPools = {
          ...game.taskPools,
          [diff]: (game.taskPools?.[diff] || []).filter((x) => x.id !== taskId),
        };
        const usedPoolTaskIds = (game.usedPoolTaskIds || []).filter((id) => id !== taskId);
        return { ...game, taskPools, usedPoolTaskIds };
      }

      case "ADMIN_CLEAR_TASK_POOLS": {
        const taskPools: Record<string, any[]> = { "1": [], "2": [], "3": [] };
        const usedPoolTaskIds: string[] = [];
        let next = { ...game, taskPools, usedPoolTaskIds };
        next = addLog(next, "Admin cleared all task pools.");
        return next;
      }

      case "ADMIN_CLEAR_POWERUP_TILES": {
        const powerupTiles: any[] = [];
        const teams: Team[] = (game.teams || []).map((t) => ({
          ...t,
          claimedPowerupTiles: [],
        }));
        let next = { ...game, powerupTiles, teams };
        next = addLog(next, "Admin cleared all powerup tiles.");
        return next;
      }

      case "ADMIN_IMPORT_POOL_TASKS": {
        // Import tasks to task pools based on difficulty
        const taskPools = { ...game.taskPools };
        
        event.tasks.forEach((task: { difficulty: number; label: string; maxCompletions: number; minCompletions: number; instructions: string; image: string }) => {
          const difficulty = task.difficulty;
          if (difficulty >= 1 && difficulty <= 3) {
            if (!taskPools[difficulty]) {
              taskPools[difficulty] = [];
            }
            taskPools[difficulty].push({
              id: uid(),
              label: task.label,
              instructions: task.instructions,
              image: task.image,
              maxCompletions: task.maxCompletions,
              minCompletions: task.minCompletions,
              used: false,
            });
          }
        });
        
        let next = { ...game, taskPools };
        next = addLog(next, `Admin imported ${event.tasks.length} tasks to pools`);
        return next;
      }

      case "ADMIN_IMPORT_POWERUPS": {
        // Import powerup tiles
        const maxId = (game.powerupTiles || []).reduce((m, t) => Math.max(m, t.id), 0);
        let nextId = maxId + 1;
        
        const newPowerups = event.powerups.map((powerup) => ({
          id: nextId++,
          label: powerup.label,
          rewardPowerupId: powerup.powerupType,
          instructions: powerup.instructions,
          image: powerup.image,
          link: powerup.image,
          pointsPerCompletion: powerup.pointsPerCompletion,
          maxCompletions: powerup.maxCompletions,
          minCompletions: powerup.minCompletions,
          claimType: powerup.claimType,
        }));
        
        const powerupTiles = [...(game.powerupTiles || []), ...newPowerups];
        let next = { ...game, powerupTiles };
        next = addLog(next, `Admin imported ${event.powerups.length} powerup tiles`);
        return next;
      }

      case "ADMIN_RANDOMIZE_BOARD": {
        // Assign random unused tasks from pools to race board
        const taskPools = { ...game.taskPools };
        const raceTiles: RaceTile[] = [];
        
        // Define difficulty distribution (you can customize this)
        const distribution: { [key: number]: number } = {
          1: 20, // 20 easy tiles
          2: 20, // 20 medium tiles
          3: 16, // 16 hard tiles
        };
        
        let tileNumber = 1;
        for (let difficulty = 1; difficulty <= 3; difficulty++) {
          const pool = taskPools[difficulty] || [];
          const unusedTasks = pool.filter((t) => !t.used);
          const count = distribution[difficulty] || 0;
          
          // Shuffle unused tasks
          const shuffled = [...unusedTasks].sort(() => Math.random() - 0.5);
          
          for (let i = 0; i < count && i < shuffled.length; i++) {
            const task = shuffled[i];
            raceTiles.push({
              n: tileNumber++,
              label: task.label,
              difficulty: difficulty as 1 | 2 | 3,
              instructions: task.instructions,
              image: task.image,
              rewardPowerupId: null,
              maxCompletions: 1,
              minCompletions: 1,
            });
            
            // Mark task as used
            const taskIndex = pool.findIndex((t) => t === task);
            if (taskIndex !== -1) {
              pool[taskIndex] = { ...task, used: true };
            }
          }
        }
        
        let next = { ...game, raceTiles, taskPools };
        next = addLog(next, `Admin randomized race board with ${raceTiles.length} tiles`);
        return next;
      }

      case "ADMIN_SET_FOG_OF_WAR": {
        const mode = event.mode || "none";
        
        // If disabling fog of war, reveal all tiles
        if (mode !== "none") {
          const revealedTiles: number[] = [];
          for (let i = 1; i <= MAX_TILE; i++) {
            revealedTiles.push(i);
          }
          
          let next: GameState = { ...game, fogOfWarDisabled: mode, revealedTiles };
          const modeText = mode === "admin" ? "for admin only" : "for everyone";
          next = addLog(next, `Admin disabled fog of war ${modeText} - all tiles revealed`);
          return next;
        } else {
          // Re-enable fog of war - reset revealed tiles to current team progress
          const revealedTiles = new Set<number>();
          const CHUNK_SIZE = 8;
          
          game.teams.forEach((team) => {
            const pos = team.pos;
            const chunk = Math.floor((pos - 1) / CHUNK_SIZE);
            for (let c = 0; c <= chunk; c++) {
              const chunkStart = c * CHUNK_SIZE + 1;
              const chunkEnd = Math.min((c + 1) * CHUNK_SIZE, MAX_TILE - 1);
              for (let i = chunkStart; i <= chunkEnd; i++) {
                revealedTiles.add(i);
              }
            }
          });
          
          let next: GameState = { ...game, fogOfWarDisabled: mode, revealedTiles: Array.from(revealedTiles) };
          next = addLog(next, "Admin re-enabled fog of war");
          return next;
        }
      }

      case "ADMIN_RANDOMIZE_TILES": {
        // Assign random unused tasks from pools based on existing tile difficulties
        const taskPools = { ...game.taskPools };
        const usedPoolTaskIds = new Set(game.usedPoolTaskIds || []);
        
        // Check unused tasks in each pool before randomizing
        const pool1 = taskPools["1"] || [];
        const pool2 = taskPools["2"] || [];
        const pool3 = taskPools["3"] || [];
        
        const unusedInPool = {
          1: pool1.filter((t) => !usedPoolTaskIds.has(t.id)).length,
          2: pool2.filter((t) => !usedPoolTaskIds.has(t.id)).length,
          3: pool3.filter((t) => !usedPoolTaskIds.has(t.id)).length,
        };
        
        const warnings: string[] = [];
        if (unusedInPool[1] <= 3) {
          warnings.push(`Easy pool has only ${unusedInPool[1]} unused tasks`);
        }
        if (unusedInPool[2] <= 3) {
          warnings.push(`Medium pool has only ${unusedInPool[2]} unused tasks`);
        }
        if (unusedInPool[3] <= 3) {
          warnings.push(`Hard pool has only ${unusedInPool[3]} unused tasks`);
        }
        
        const unfilledTiles: number[] = [];
        
        const raceTiles = game.raceTiles.map((tile) => {
          const difficulty = tile.difficulty;
          const pool = taskPools[String(difficulty)] || [];
          
          // Find unused tasks in the pool
          const unusedTasks = pool.filter((t) => !usedPoolTaskIds.has(t.id));
          
          if (unusedTasks.length === 0) {
            // No unused tasks available, track this as an error
            unfilledTiles.push(tile.n);
            return tile;
          }
          
          // Pick a random unused task
          const randomIndex = Math.floor(Math.random() * unusedTasks.length);
          const selectedTask = unusedTasks[randomIndex];
          
          // Mark task as used
          usedPoolTaskIds.add(selectedTask.id);
          const poolIndex = pool.findIndex((t) => t.id === selectedTask.id);
          if (poolIndex !== -1) {
            pool[poolIndex] = { ...selectedTask, used: true };
          }
          
          // Create new tile with selected task
          return {
            ...tile,
            label: selectedTask.label,
            instructions: selectedTask.instructions || "",
            image: selectedTask.image || "",
            maxCompletions: selectedTask.maxCompletions || 1,
            minCompletions: selectedTask.minCompletions || 1,
          };
        });
        
        // Add error for unfilled tiles
        if (unfilledTiles.length > 0) {
          warnings.push(`Could not fill ${unfilledTiles.length} tile(s): ${unfilledTiles.join(", ")}`);
        }
        
        let next = { 
          ...game, 
          raceTiles, 
          taskPools, 
          usedPoolTaskIds: Array.from(usedPoolTaskIds)
        };
        
        // Only remove fog of war if there are warnings (errors filling tiles)
        if (warnings.length > 0) {
          const revealedTiles: number[] = [];
          for (let i = 1; i <= MAX_TILE; i++) {
            revealedTiles.push(i);
          }
          next = { ...next, revealedTiles };
          
          next = addLog(
            next, 
            `Admin randomized tiles from pools (assigned ${raceTiles.length - unfilledTiles.length} tasks) - WARNING: ${warnings.join(", ")} - Fog of war removed to alert admin`
          );
        } else {
          next = addLog(next, `Admin randomized tiles from pools (assigned ${raceTiles.length} tasks)`);
        }
        
        return next;
      }

      case "ADMIN_RANDOMIZE_DIFFICULTIES": {
        // Debug: Log what settings are received
        console.log("ADMIN_RANDOMIZE_DIFFICULTIES event:", {
          early: event.early,
          late: event.late,
        });
        
        // Save gradient settings for future use (always in gradient mode now)
        const gradientSettings = {
          weights: { easy: 50, medium: 35, hard: 15 }, // Not used, for backward compatibility
          gradient: true,
          early: event.early || { easy: 70, medium: 25, hard: 5 },
          late: event.late || { easy: 20, medium: 35, hard: 45 },
        };
        
        // Check task pool availability first
        const MIN_REMAINING = 3;
        const MIN_HARD_TILES = 18; // Minimum hard tiles required on board
        const pool1 = game.taskPools?.["1"] || [];
        const pool2 = game.taskPools?.["2"] || [];
        const pool3 = game.taskPools?.["3"] || [];

        // Count available tasks in each pool
        const available = {
          1: pool1.length,
          2: pool2.length,
          3: pool3.length,
        };

        // Assign difficulties with constraints
        const earlyThreshold = Math.floor(MAX_TILE * 0.3); // First ~30% of tiles (tiles 1-17 out of 56)
        const lateThreshold = Math.floor(MAX_TILE * 0.7);  // Last ~30% of tiles (tiles 40-56 out of 56)
        
        // Helper function to get normalized weights based on position
        // Early game: first 30% use early weights
        // Middle game: 30%-70% blend between early and late weights
        // Late game: last 30% use late weights
        const getNormalizedWeights = (index: number) => {
          let weights;
          
          if (index < earlyThreshold) {
            // Early game: use early weights
            weights = gradientSettings.early;
          } else if (index >= lateThreshold) {
            // Late game: use late weights
            weights = gradientSettings.late;
          } else {
            // Middle game: blend early and late weights based on position
            const middleProgress = (index - earlyThreshold) / (lateThreshold - earlyThreshold);
            weights = {
              easy: Math.round(gradientSettings.early.easy * (1 - middleProgress) + gradientSettings.late.easy * middleProgress),
              medium: Math.round(gradientSettings.early.medium * (1 - middleProgress) + gradientSettings.late.medium * middleProgress),
              hard: Math.round(gradientSettings.early.hard * (1 - middleProgress) + gradientSettings.late.hard * middleProgress),
            };
          }
          
          const totalWeight = weights.easy + weights.medium + weights.hard;
          return {
            easy: weights.easy / totalWeight,
            medium: weights.medium / totalWeight,
            hard: weights.hard / totalWeight,
          };
        };

        // Count tiles that must be each difficulty
        const counts = { 1: 0, 2: 0, 3: 0 };
        
        // First pass: assign fixed tiles and count them
        // Tile 1-2: easy, Tile 3-4: medium, Tile 5: hard, Final tile: hard
        const fixedHardTiles = 2; // Tile 5 and tile 56
        const minRandomHardTiles = MIN_HARD_TILES - fixedHardTiles; // Need at least 16 more hard tiles
        
        // Initialize raceTiles array with proper size
        const raceTiles: RaceTile[] = new Array(game.raceTiles.length);
        
        // Define sections for randomization order: early (0-33%), late (67-100%), middle (33-67%)
        const earlyEnd = Math.floor(MAX_TILE * 0.33);
        const lateStart = Math.floor(MAX_TILE * 0.67);
        
        // Randomization order: early -> late -> middle
        const randomizationOrder: number[] = [];
        
        // Add early section (0 to earlyEnd-1)
        for (let i = 0; i < earlyEnd; i++) {
          randomizationOrder.push(i);
        }
        
        // Add late section (lateStart to MAX_TILE-1)
        for (let i = lateStart; i < game.raceTiles.length; i++) {
          randomizationOrder.push(i);
        }
        
        // Add middle section (earlyEnd to lateStart-1)
        for (let i = earlyEnd; i < lateStart; i++) {
          randomizationOrder.push(i);
        }
        
        // Process tiles in the defined order
        for (const index of randomizationOrder) {
          const tile = game.raceTiles[index];
          let difficulty: 1 | 2 | 3;
          
          if (tile.n === MAX_TILE) {
            difficulty = 3; // Final tile (56th) always hard
          } else if (index === 0 || index === 1) {
            difficulty = 1; // Tiles 1-2: easy
          } else if (index === 2 || index === 3) {
            difficulty = 2; // Tiles 3-4: medium
          } else if (index === 4) {
            difficulty = 3; // Tile 5: hard
          } else {
            // Get position-based weights
            const normalized = getNormalizedWeights(index);
            
            // Check consecutive tiles to prevent streaks
            const isAfterHalfway = index >= Math.floor(MAX_TILE / 2); // After tile 28 (halfway)
            
            // Check distance to last hard tile (max 7 non-hard tiles between hards)
            // Only check tiles that have been assigned so far
            const maxHardGap = 7;
            let tilesSinceLastHard = 0;
            for (let i = index - 1; i >= 0; i--) {
              if (!raceTiles[i]) continue; // Skip unassigned tiles
              if (raceTiles[i].difficulty === 3) break;
              tilesSinceLastHard++;
            }
            
            // Check streak only among assigned adjacent tiles
            let streak = 1;
            let prevDiff: 1 | 2 | 3 | undefined = raceTiles[index - 1]?.difficulty;
            if (prevDiff) {
              for (let i = index - 2; i >= 0 && raceTiles[i]?.difficulty === prevDiff; i--) {
                streak++;
              }
            }
            
            // Function to get max streak for a difficulty
            const getMaxStreak = (diff: 1 | 2 | 3) => {
              if (isAfterHalfway && (diff === 2 || diff === 3)) {
                return 3; // Allow 3 medium or hard in a row after halfway
              }
              return 2; // Default max 2 in a row
            };
            
            // Random assignment based on position-specific weights
            const rand = Math.random();
            let candidateDiff: 1 | 2 | 3;
            const forceHard = tilesSinceLastHard >= maxHardGap; // Remember if we need to force hard
            
            // Force hard tile if it's been too long since last hard
            if (forceHard) {
              candidateDiff = 3;
            } else if (rand < normalized.easy) {
              candidateDiff = 1;
            } else if (rand < normalized.easy + normalized.medium) {
              candidateDiff = 2;
            } else {
              candidateDiff = 3;
            }
            
            // Check if candidate would create too long a streak (but not if we're forcing hard)
            if (!forceHard && candidateDiff === prevDiff && streak >= getMaxStreak(candidateDiff)) {
              // Can't use this difficulty, pick different one
              const alternatives: (1 | 2 | 3)[] = [1, 2, 3].filter(d => d !== prevDiff) as (1 | 2 | 3)[];
              candidateDiff = alternatives[Math.floor(Math.random() * alternatives.length)];
            }
            
            // Check pool availability - NEVER violate this constraint
            if (counts[candidateDiff] >= available[candidateDiff] - MIN_REMAINING) {
              if (forceHard) {
                // Critical error: need to force hard tile but pool is exhausted
                // Remove fog of war and log error
                let errorState = { ...game };
                errorState.fogOfWarDisabled = "all";
                errorState = addLog(errorState, `⚠️ ERROR: Cannot randomize difficulties - not enough hard tasks in pool to maintain max ${maxHardGap}-tile gaps between hard tiles. Fog of war disabled.`);
                return errorState;
              }
              
              // Fallback: assign to pool with most available space, but respect streak limits
              const space1 = available[1] - counts[1] - MIN_REMAINING;
              const space2 = available[2] - counts[2] - MIN_REMAINING;
              const space3 = available[3] - counts[3] - MIN_REMAINING;
              
              // Filter out options that would violate streak rules
              const validOptions: Array<{ diff: 1 | 2 | 3, space: number }> = [];
              if (space1 > 0 && !(prevDiff === 1 && streak >= getMaxStreak(1))) {
                validOptions.push({ diff: 1, space: space1 });
              }
              if (space2 > 0 && !(prevDiff === 2 && streak >= getMaxStreak(2))) {
                validOptions.push({ diff: 2, space: space2 });
              }
              if (space3 > 0 && !(prevDiff === 3 && streak >= getMaxStreak(3))) {
                validOptions.push({ diff: 3, space: space3 });
              }
              
              if (validOptions.length > 0) {
                // Pick the option with most available space
                validOptions.sort((a, b) => b.space - a.space);
                difficulty = validOptions[0].diff;
              } else {
                // Critical error: no valid options available
                let errorState = { ...game };
                errorState.fogOfWarDisabled = "all";
                errorState = addLog(errorState, `⚠️ ERROR: Cannot randomize difficulties - task pools exhausted and no valid assignments possible. Fog of war disabled.`);
                return errorState;
              }
            } else {
              difficulty = candidateDiff;
            }
          }

          counts[difficulty]++;
          raceTiles[index] = { ...tile, difficulty };
        }

        // Check if we have enough hard tiles
        if (counts[3] < MIN_HARD_TILES) {
          // Need to convert some easy/medium tiles to hard
          const shortfall = MIN_HARD_TILES - counts[3];
          let converted = 0;
          
          // Convert tiles starting from index 5 (after fixed tiles)
          for (let i = 5; i < raceTiles.length - 1 && converted < shortfall; i++) {
            if (raceTiles[i].difficulty !== 3 && counts[3] < available[3] - MIN_REMAINING) {
              const oldDiff: 1 | 2 | 3 = raceTiles[i].difficulty;
              raceTiles[i] = { ...raceTiles[i], difficulty: 3 };
              counts[oldDiff]--;
              counts[3]++;
              converted++;
            }
          }
        }

        // Validate we have enough tasks
        const warnings: string[] = [];
        if (counts[1] > available[1] - MIN_REMAINING) {
          warnings.push(`Easy pool needs ${counts[1] + MIN_REMAINING - available[1]} more tasks`);
        }
        if (counts[2] > available[2] - MIN_REMAINING) {
          warnings.push(`Medium pool needs ${counts[2] + MIN_REMAINING - available[2]} more tasks`);
        }
        if (counts[3] > available[3] - MIN_REMAINING) {
          warnings.push(`Hard pool needs ${counts[3] + MIN_REMAINING - available[3]} more tasks`);
        }

        let next: GameState = { ...game, raceTiles, gradientSettings };
        next.usedPoolTaskIds = [];
        
        const logMsg = warnings.length > 0
          ? `Admin randomized difficulties (E:${counts[1]} M:${counts[2]} H:${counts[3]}) - WARNING: ${warnings.join(", ")}`
          : `Admin randomized difficulties (E:${counts[1]} M:${counts[2]} H:${counts[3]}, pools: ${available[1] - counts[1]}/${available[2] - counts[2]}/${available[3] - counts[3]} remaining)`;
        
        next = addLog(next, logMsg);
        return next;
      }

      case "ADMIN_SAVE_GRADIENT_SETTINGS": {
        const gradientSettings = {
          weights: { easy: 50, medium: 35, hard: 15 }, // Not used, for backward compatibility  
          gradient: true,
          early: event.early || { easy: 70, medium: 25, hard: 5 },
          late: event.late || { easy: 20, medium: 35, hard: 45 },
        };
        let next: GameState = { ...game, gradientSettings };
        next = addLog(next, `Admin saved gradient settings`);
        return next;
      }

      case "ADMIN_IMPORT_TILES": {
        let next = { ...game, raceTiles: event.tiles };
        next = addLog(next, `Admin imported ${event.tiles.length} race tiles.`);
        return next;
      }

      case "ADMIN_ADD_ADMIN": {
        const name = (event.name || "").trim();
        const password = (event.password || "").trim();
        if (!name || !password) return game;

        const newAdmin = {
          id: uid(),
          name,
          password,
          isMaster: event.isMaster || false,
        };

        const admins = [...(game.admins || []), newAdmin];
        let next = { ...game, admins };
        next = addLog(next, `Admin added: ${name}${event.isMaster ? " (Master)" : ""}`);
        return next;
      }

      case "ADMIN_REMOVE_ADMIN": {
        const admin = game.admins.find((a) => a.id === event.adminId);
        if (!admin) return game;
        if (admin.isMaster) {
          return addLog(game, `Cannot remove master admin: ${admin.name}`);
        }

        const admins = game.admins.filter((a) => a.id !== event.adminId);
        let next = { ...game, admins };
        next = addLog(next, `Admin removed: ${admin.name}`);
        return next;
      }

      case "ADMIN_CHANGE_PASSWORD": {
        const currentAdmin = game.admins.find((a) => a.password === event.oldPassword);
        if (!currentAdmin) {
          return addLog(game, "Password change failed: incorrect current password");
        }

        const admins = game.admins.map((a) =>
          a.id === currentAdmin.id ? { ...a, password: event.newPassword } : a
        );
        let next = { ...game, admins };
        next = addLog(next, `Password changed for admin: ${currentAdmin.name}`);
        return next;
      }

      case "ADMIN_SET_ALL_TEAM_PASSWORDS": {
        const password = event.password;
        const teams = game.teams.map((t) => ({ ...t, password: password || null }));
        let next = { ...game, teams };
        next = addLog(next, `Password set for all ${teams.length} team(s)`);
        return next;
      }

      case "ADMIN_UNDO": {
        const history = game.eventHistory || [];
        if (history.length === 0) {
          return addLog(game, "Nothing to undo - no history available");
        }
        
        // Get the most recent state from history
        const previousState = history[history.length - 1];
        // Remove the last item from history
        const newHistory = history.slice(0, -1);
        
        // Restore previous state with updated history and add log
        let next: GameState = { ...previousState, eventHistory: newHistory };
        next = addLog(next, "Admin undid last action");
        return next;
      }

      case "ADMIN_UPDATE_TEAM": {
        const teams = game.teams.map((t) => {
          if (t.id === event.teamId) {
            return { ...t, ...event.updates };
          }
          return t;
        });
        let next = { ...game, teams };
        const team = teams.find((t) => t.id === event.teamId);
        next = addLog(next, `Admin updated team: ${team?.name || "Unknown"}`);
        return next;
      }

      default:
        return game;
    }
  } catch (error) {
    console.error("Error applying event:", error);
    return addLog(game, `Error: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
