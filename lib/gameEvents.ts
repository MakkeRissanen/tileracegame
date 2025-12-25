import {
  GameState,
  GameEvent,
  MAX_TILE,
  Team,
  RaceTile,
  PoolTask,
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
import { handleUsePowerup } from "./usePowerupHandler";

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

        // Calculate points first (before modifying state)
        const diff = tileDiff(game, completedTile);
        const doubledTilesInfoScoring = game.doubledTilesInfo || {};
        const isDoubledWithDiffPoints =
          doubledTilesInfoScoring[completedTile]?.useDifficultyPoints || false;
        const isMultiCompletion = Math.max(1, Number(rt.maxCompletions || 1)) > 1;
        const pointsForDiff =
          isMultiCompletion && !isDoubledWithDiffPoints
            ? 1
            : diff === 1
            ? 1
            : diff === 2
            ? 2
            : 3;

        const nextPos = simulateAdvance(team, 1);
        const teams = game.teams.map((t) => {
          if (t.id === event.teamId) {
            // Update team's player points for this completion
            const updatedPlayerPoints = { ...(t.playerPoints || {}) };
            playerNames.forEach((playerName) => {
              updatedPlayerPoints[playerName] = (updatedPlayerPoints[playerName] || 0) + pointsForDiff;
            });
            return { ...t, pos: nextPos, powerupCooldown: false, playerPoints: updatedPlayerPoints };
          }
          return t;
        });
        let next = { ...game, teams };

        // Update revealed tiles based on dynamic vision
        const revealedTiles = new Set(game.revealedTiles || []);
        
        // Always reveal first 4 tiles
        for (let i = 1; i <= 4; i++) {
          revealedTiles.add(i);
        }

        // Find farthest team position
        let farthestPos = 1;
        game.teams.forEach((team) => {
          if (team.pos > farthestPos) {
            farthestPos = team.pos;
          }
        });

        // Determine vision range based on position
        let visionAhead;
        if (farthestPos >= MAX_TILE - 5) {
          // Last 5 tiles: 1 tile ahead
          visionAhead = 1;
        } else if (farthestPos >= MAX_TILE - 10) {
          // Last 10 tiles (before final 5): 2 tiles ahead
          visionAhead = 2;
        } else if (farthestPos >= Math.floor(MAX_TILE / 2)) {
          // Halfway point: 3 tiles ahead
          visionAhead = 3;
        } else {
          // Normal: 4 tiles ahead
          visionAhead = 4;
        }

        // Reveal tiles from farthest position up to vision range (only add, never remove)
        // But NEVER reveal the final tile until a team reaches it
        for (let i = 1; i <= Math.min(farthestPos + visionAhead, MAX_TILE - 1); i++) {
          revealedTiles.add(i);
        }
        
        // Only reveal final tile if a team has reached it
        if (farthestPos >= MAX_TILE) {
          revealedTiles.add(MAX_TILE);
        }

        next = { ...next, revealedTiles: Array.from(revealedTiles) };

        const rewardRes = maybeGrantMainTileReward(next, event.teamId, completedTile);
        next = rewardRes.game;

        const playersText = playerNames.join(", ");
        const totalPoints = pointsForDiff * playerNames.length;
        const isDoubledTile = doubledTilesInfoScoring[completedTile] ? true : false;
        const doubledText = isDoubledTile ? "doubled " : "";

        if (completedTile === MAX_TILE) {
          next = addLog(
            next,
            `🏆🎉 ${team.name} completed the ${doubledText}Final Tile! ${playersText} are the WINNERS! 🏆🎉 (+${pointsForDiff} pts each)${
              rewardRes.granted ? ` ⚡ Reward gained: ${powerupLabel(rewardRes.granted)}` : ""
            }`
          );
        } else if (nextPos === completedTile) {
          next = addLog(
            next,
            `${team.name}, ${playersText} completed ${tileDesc(
              next,
              completedTile
            )} (already at finish) +${pointsForDiff} pts each → Current: ${tileDesc(next, nextPos)}`
          );
        } else {
          const baseMessage = `${team.name}, ${playersText} completed ${doubledText}Tile ${completedTile}: "${completedLabel}" (+${pointsForDiff} pts each) → Current: ${tileDesc(next, nextPos)}`;
          const rewardMessage = rewardRes.granted ? `${team.name} gained ${powerupLabel(rewardRes.granted)}` : "";
          
          next = addLog(
            next,
            rewardMessage ? `${baseMessage}\n${rewardMessage}` : baseMessage
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
          )}${rewardRes.granted ? ` ⚡ Reward gained: ${powerupLabel(rewardRes.granted)}` : ""}`
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
        const powerupName = powerupLabel(tile.rewardPowerupId);
        next = addLog(
          next,
          `${team.name} gained ${powerupName}\n${playerList} completed "${tile.label}" (+${pointsPerCompletion} pts each)`
        );
        return next;
      }

      case "USE_POWERUP": {
        return handleUsePowerup(game, {
          ...event,
          futureTile: event.futureTile !== undefined ? String(event.futureTile) : undefined
        });
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

        const oldTile = game.raceTiles.find((t) => t.n === n);
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
        
        // Build change description
        const changes: string[] = [];
        if (oldTile) {
          if (oldTile.label !== label) changes.push(`label: "${oldTile.label}" → "${label}"`);
          if (oldTile.difficulty !== difficulty) changes.push(`difficulty: ${oldTile.difficulty} → ${difficulty}`);
          if (oldTile.rewardPowerupId !== rewardPowerupId) {
            const oldReward = oldTile.rewardPowerupId ? powerupLabel(oldTile.rewardPowerupId) : "none";
            const newReward = rewardPowerupId ? powerupLabel(rewardPowerupId) : "none";
            changes.push(`reward: ${oldReward} → ${newReward}`);
          }
          if (oldTile.maxCompletions !== maxCompletions) changes.push(`maxCompletions: ${oldTile.maxCompletions} → ${maxCompletions}`);
          if (oldTile.minCompletions !== minCompletions) changes.push(`minCompletions: ${oldTile.minCompletions} → ${minCompletions}`);
        }
        
        const changeDesc = changes.length > 0 ? ` (${changes.join(", ")})` : "";
        next = addLog(next, `Admin updated Tile ${n}${changeDesc}`);
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

        const oldTile = (game.powerupTiles || []).find((t) => t.id === id);
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
        
        // Build change description
        const changes: string[] = [];
        if (oldTile) {
          if (oldTile.label !== label) changes.push(`label: "${oldTile.label}" → "${label}"`);
          const finalReward = rewardPowerupId || oldTile.rewardPowerupId;
          if (oldTile.rewardPowerupId !== finalReward) {
            changes.push(`reward: ${powerupLabel(oldTile.rewardPowerupId)} → ${powerupLabel(finalReward)}`);
          }
          if (oldTile.pointsPerCompletion !== pointsPerCompletion) changes.push(`points: ${oldTile.pointsPerCompletion} → ${pointsPerCompletion}`);
          if (oldTile.maxCompletions !== maxCompletions) changes.push(`maxCompletions: ${oldTile.maxCompletions} → ${maxCompletions}`);
          if (oldTile.minCompletions !== minCompletions) changes.push(`minCompletions: ${oldTile.minCompletions} → ${minCompletions}`);
          if (oldTile.claimType !== claimType) changes.push(`claimType: ${oldTile.claimType} → ${claimType}`);
        }
        
        const changeDesc = changes.length > 0 ? ` (${changes.join(", ")})` : "";
        next = addLog(next, `Admin updated Powerup tile P${id}${changeDesc}`);
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

        const oldTask = (game.taskPools?.[diff] || []).find((t) => t.id === id);
        const pool = (game.taskPools?.[diff] || []).map((t) =>
          t.id === id ? { ...t, label, instructions, image } : t
        );
        const taskPools = { ...game.taskPools, [diff]: pool };
        let next = { ...game, taskPools };
        
        // Build change description
        const changes: string[] = [];
        if (oldTask) {
          if (oldTask.label !== label) changes.push(`label: "${oldTask.label}" → "${label}"`);
          if (oldTask.instructions !== instructions && (oldTask.instructions || instructions)) {
            changes.push(`instructions changed`);
          }
          if (oldTask.image !== image && (oldTask.image || image)) {
            changes.push(`image changed`);
          }
        }
        
        const changeDesc = changes.length > 0 ? ` (${changes.join(", ")})` : "";
        next = addLog(next, `Admin edited pool task (difficulty ${diff})${changeDesc}`);
        return next;
      }

      case "ADMIN_REMOVE_POOL_TASK": {
        const diff = String(clamp(Number(event.diff || 1), 1, 3));
        const taskId = event.taskId;
        const removedTask = (game.taskPools?.[diff] || []).find((x) => x.id === taskId);
        const taskPools = {
          ...game.taskPools,
          [diff]: (game.taskPools?.[diff] || []).filter((x) => x.id !== taskId),
        };
        const usedPoolTaskIds = (game.usedPoolTaskIds || []).filter((id) => id !== taskId);
        let next = { ...game, taskPools, usedPoolTaskIds };
        if (removedTask) {
          next = addLog(next, `Admin removed pool task (difficulty ${diff}): "${removedTask.label}"`);
        }
        return next;
      }

      case "ADMIN_CLEAR_TASK_POOLS": {
        const count1 = (game.taskPools?.["1"] || []).length;
        const count2 = (game.taskPools?.["2"] || []).length;
        const count3 = (game.taskPools?.["3"] || []).length;
        const totalCount = count1 + count2 + count3;
        const taskPools: Record<string, any[]> = { "1": [], "2": [], "3": [] };
        const usedPoolTaskIds: string[] = [];
        let next = { ...game, taskPools, usedPoolTaskIds };
        next = addLog(next, `Admin cleared all task pools (removed ${totalCount} tasks: E:${count1} M:${count2} H:${count3})`);
        return next;
      }

      case "ADMIN_CLEAR_POWERUP_TILES": {
        const tileCount = (game.powerupTiles || []).length;
        const powerupTiles: any[] = [];
        const teams: Team[] = (game.teams || []).map((t) => ({
          ...t,
          claimedPowerupTiles: [],
        }));
        let next = { ...game, powerupTiles, teams };
        next = addLog(next, `Admin cleared all powerup tiles (removed ${tileCount} tiles)`);
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
        const oldMode = game.fogOfWarDisabled || "none";
        const mode = event.mode || "none";
        
        // If disabling fog of war, reveal all tiles
        if (mode !== "none") {
          const revealedTiles: number[] = [];
          for (let i = 1; i <= MAX_TILE; i++) {
            revealedTiles.push(i);
          }
          
          let next: GameState = { ...game, fogOfWarDisabled: mode, revealedTiles };
          const modeText = mode === "admin" ? "for admin only" : "for everyone";
          next = addLog(next, `Admin changed fog of war: ${oldMode} → ${mode} (disabled ${modeText}) - all tiles revealed`);
          return next;
        } else {
          // Re-enable fog of war - reset revealed tiles to current team progress
          const revealedTiles = new Set<number>();
          
          // Always reveal first 4 tiles
          for (let i = 1; i <= 4; i++) {
            revealedTiles.add(i);
          }
          
          if (game.teams && game.teams.length > 0) {
            // Find farthest team position
            let farthestPos = 1;
            game.teams.forEach((team) => {
              if (team.pos > farthestPos) {
                farthestPos = team.pos;
              }
            });

            // Determine vision range based on position
            let visionAhead;
            if (farthestPos >= MAX_TILE - 5) {
              visionAhead = 1;
            } else if (farthestPos >= MAX_TILE - 10) {
              visionAhead = 2;
            } else if (farthestPos >= Math.floor(MAX_TILE / 2)) {
              visionAhead = 3;
            } else {
              visionAhead = 4;
            }

            // Reveal tiles from 1 to farthest + vision (but not final tile)
            for (let i = 1; i <= Math.min(farthestPos + visionAhead, MAX_TILE - 1); i++) {
              revealedTiles.add(i);
            }
            
            // Only reveal final tile if a team has reached it
            if (farthestPos >= MAX_TILE) {
              revealedTiles.add(MAX_TILE);
            }
          }
          
          let next: GameState = { ...game, fogOfWarDisabled: mode, revealedTiles: Array.from(revealedTiles) };
          next = addLog(next, `Admin changed fog of war: ${oldMode} → ${mode} (re-enabled, ${revealedTiles.size} tiles revealed)`);
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
        
        // Reset fog of war state at start of randomization
        // It will be re-enabled if errors occur
        let workingState = { ...game };
        if (workingState.fogOfWarDisabled === "all") {
          workingState.fogOfWarDisabled = "none";
          // Reveal tiles based on team positions with dynamic vision
          const revealedTiles = new Set<number>();
          
          // Always reveal first 4 tiles
          for (let i = 1; i <= 4; i++) {
            revealedTiles.add(i);
          }
          
          if (workingState.teams && workingState.teams.length > 0) {
            // Find farthest team position
            let farthestPos = 1;
            workingState.teams.forEach((team) => {
              if (team.pos > farthestPos) {
                farthestPos = team.pos;
              }
            });

            // Determine vision range based on position
            let visionAhead;
            if (farthestPos >= MAX_TILE - 5) {
              visionAhead = 1;
            } else if (farthestPos >= MAX_TILE - 10) {
              visionAhead = 2;
            } else if (farthestPos >= Math.floor(MAX_TILE / 2)) {
              visionAhead = 3;
            } else {
              visionAhead = 4;
            }

            // Reveal tiles from 1 to farthest + vision (but not final tile)
            for (let i = 1; i <= Math.min(farthestPos + visionAhead, MAX_TILE - 1); i++) {
              revealedTiles.add(i);
            }
            
            // Only reveal final tile if a team has reached it
            if (farthestPos >= MAX_TILE) {
              revealedTiles.add(MAX_TILE);
            }
          }
          
          workingState.revealedTiles = Array.from(revealedTiles);
          console.log("Reset fog of war state from previous error");
        }
        
        // Save gradient settings for future use (always in gradient mode now)
        const gradientSettings = {
          weights: { easy: 50, medium: 35, hard: 15 }, // Not used, for backward compatibility
          gradient: true,
          early: event.early || { easy: 65, medium: 30, hard: 5 },
          late: event.late || { easy: 5, medium: 39, hard: 56 },
        };
        
        // IMPORTANT: Clear all "used" flags from task pools before randomization
        const taskPools = { ...workingState.taskPools };
        if (taskPools["1"]) {
          taskPools["1"] = taskPools["1"].map(t => ({ ...t, used: false }));
        }
        if (taskPools["2"]) {
          taskPools["2"] = taskPools["2"].map(t => ({ ...t, used: false }));
        }
        if (taskPools["3"]) {
          taskPools["3"] = taskPools["3"].map(t => ({ ...t, used: false }));
        }
        
        // Check task pool availability first
        const MIN_REMAINING = 3;
        const MIN_HARD_TILES = 17; // Minimum hard tiles required on board
        const pool1 = taskPools["1"] || [];
        const pool2 = taskPools["2"] || [];
        const pool3 = taskPools["3"] || [];

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
        const raceTiles: RaceTile[] = new Array(workingState.raceTiles.length);
        
        // Define sections for gradient distribution
        const earlyEnd = Math.floor(MAX_TILE * 0.33);
        const lateStart = Math.floor(MAX_TILE * 0.67);
        
        // CRITICAL: Process tiles in SEQUENTIAL order (0 to MAX_TILE)
        // This is required for consecutive tile checking to work properly
        // The gradient weights are position-based, so we still get early/middle/late distribution
        const randomizationOrder: number[] = [];
        for (let i = 0; i < workingState.raceTiles.length; i++) {
          randomizationOrder.push(i);
        }
        
        // Process tiles in sequential order
        for (const index of randomizationOrder) {
          const tile = workingState.raceTiles[index];
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
              console.log(`Tile ${index}: Prevented streak - prevDiff=${prevDiff}, streak=${streak}, maxStreak=${getMaxStreak(candidateDiff)}, candidateDiff=${candidateDiff}`);
              const alternatives: (1 | 2 | 3)[] = [1, 2, 3].filter(d => d !== prevDiff) as (1 | 2 | 3)[];
              candidateDiff = alternatives[Math.floor(Math.random() * alternatives.length)];
              console.log(`Tile ${index}: Changed to candidateDiff=${candidateDiff}`);
            }
            
            // Check pool availability - NEVER violate this constraint
            if (counts[candidateDiff] >= available[candidateDiff] - MIN_REMAINING) {
              if (forceHard) {
                // Critical error: need to force hard tile but pool is exhausted
                const clearedTiles = workingState.raceTiles.map(tile => ({
                  ...tile,
                  difficulty: 1 as 1 | 2 | 3,
                  label: "",
                  instructions: "",
                  image: "",
                  maxCompletions: 1,
                  minCompletions: 1
                }));
                
                const clearedPools = { ...workingState.taskPools };
                if (clearedPools["1"]) clearedPools["1"] = clearedPools["1"].map(t => ({ ...t, used: false }));
                if (clearedPools["2"]) clearedPools["2"] = clearedPools["2"].map(t => ({ ...t, used: false }));
                if (clearedPools["3"]) clearedPools["3"] = clearedPools["3"].map(t => ({ ...t, used: false }));
                
                let errorState: GameState = { 
                  ...workingState, 
                  raceTiles: clearedTiles,
                  taskPools: clearedPools,
                  fogOfWarDisabled: "all",
                  usedPoolTaskIds: []
                };
                errorState = addLog(errorState, `⚠️ ERROR: Not enough hard tasks to maintain max ${maxHardGap}-tile gaps. Tiles cleared, pools reset.`);
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
                const clearedTiles = workingState.raceTiles.map(tile => ({
                  ...tile,
                  difficulty: 1 as 1 | 2 | 3,
                  label: "",
                  instructions: "",
                  image: "",
                  maxCompletions: 1,
                  minCompletions: 1
                }));
                
                const clearedPools = { ...workingState.taskPools };
                if (clearedPools["1"]) clearedPools["1"] = clearedPools["1"].map(t => ({ ...t, used: false }));
                if (clearedPools["2"]) clearedPools["2"] = clearedPools["2"].map(t => ({ ...t, used: false }));
                if (clearedPools["3"]) clearedPools["3"] = clearedPools["3"].map(t => ({ ...t, used: false }));
                
                let errorState: GameState = { 
                  ...workingState, 
                  raceTiles: clearedTiles,
                  taskPools: clearedPools,
                  fogOfWarDisabled: "all",
                  usedPoolTaskIds: []
                };
                errorState = addLog(errorState, `⚠️ ERROR: Cannot randomize - task pools exhausted. Tiles cleared, pools reset.`);
                return errorState;
              }
            } else {
              difficulty = candidateDiff;
            }
          }
          
          // FINAL SAFETY CHECK: Never allow more than 3 consecutive tiles of the same difficulty
          // Count how many consecutive tiles before this one have the same difficulty
          let consecutiveCount = 0;
          for (let i = index - 1; i >= 0 && raceTiles[i]?.difficulty === difficulty; i--) {
            consecutiveCount++;
          }
          
          // If this would create 4+ in a row, force a different difficulty
          if (consecutiveCount >= 3) {
            console.log(`SAFETY: Tile ${index} would create ${consecutiveCount + 1} consecutive ${difficulty}s - forcing different difficulty`);
            const alternatives: (1 | 2 | 3)[] = [1, 2, 3].filter(d => d !== difficulty) as (1 | 2 | 3)[];
            
            // Try to pick an alternative that has available pool space
            let alternativeFound = false;
            for (const altDiff of alternatives) {
              if (counts[altDiff] < available[altDiff] - MIN_REMAINING) {
                difficulty = altDiff;
                alternativeFound = true;
                console.log(`SAFETY: Changed to difficulty ${difficulty}`);
                break;
              }
            }
            
            // If no alternative has space, just pick randomly from alternatives
            if (!alternativeFound) {
              difficulty = alternatives[Math.floor(Math.random() * alternatives.length)];
              console.log(`SAFETY: Forced to difficulty ${difficulty} (pool may be exhausted)`);
            }
          }

          counts[difficulty]++;
          // Clear task data when assigning difficulty - tiles will be filled in the next step
          raceTiles[index] = { 
            ...tile, 
            difficulty,
            label: "",
            instructions: "",
            image: "",
            maxCompletions: 1,
            minCompletions: 1
          };
          
          // Log assignment for debugging (first 15 tiles only)
          if (index <= 14) {
            console.log(`Tile ${index} (n=${tile.n}): assigned difficulty ${difficulty}, prevDiff=${raceTiles[index-1]?.difficulty}`);
          }
        }

        // Check if we have enough hard tiles
        if (counts[3] < MIN_HARD_TILES) {
          // Need to convert some easy/medium tiles to hard
          const shortfall = MIN_HARD_TILES - counts[3];
          let converted = 0;
          
          console.log(`Need to convert ${shortfall} tiles to hard to meet MIN_HARD_TILES`);
          
          // Smart conversion: Find gaps between hard tiles and fill them
          // Build a list of candidate positions with their gap sizes
          const candidates: Array<{ index: number; gapSize: number; distanceFromEnd: number }> = [];
          
          for (let i = 5; i < raceTiles.length - 1; i++) {
            if (raceTiles[i].difficulty !== 3) {
              // Check if previous tile is hard (would create consecutive)
              const prevIsHard = i > 0 && raceTiles[i - 1]?.difficulty === 3;
              if (prevIsHard) continue; // Skip to avoid consecutive
              
              // Calculate gap size (distance to nearest hard tile before and after)
              let gapBefore = 0;
              for (let j = i - 1; j >= 0; j--) {
                if (raceTiles[j]?.difficulty === 3) break;
                gapBefore++;
              }
              let gapAfter = 0;
              for (let j = i + 1; j < raceTiles.length; j++) {
                if (raceTiles[j]?.difficulty === 3) break;
                gapAfter++;
              }
              
              const totalGap = gapBefore + gapAfter;
              const distanceFromEnd = raceTiles.length - i;
              
              candidates.push({ index: i, gapSize: totalGap, distanceFromEnd });
            }
          }
          
          // Sort candidates: prioritize larger gaps, and prefer later positions
          candidates.sort((a, b) => {
            if (Math.abs(a.gapSize - b.gapSize) > 3) {
              return b.gapSize - a.gapSize; // Larger gaps first
            }
            return a.distanceFromEnd - b.distanceFromEnd; // Later positions preferred (smaller distance from end)
          });
          
          // Convert tiles from the sorted candidate list
          for (const candidate of candidates) {
            if (converted >= shortfall) break;
            if (counts[3] >= available[3] - MIN_REMAINING) break;
            
            const i = candidate.index;
            const oldDiff: 1 | 2 | 3 = raceTiles[i].difficulty;
            raceTiles[i] = { ...raceTiles[i], difficulty: 3 };
            counts[oldDiff]--;
            counts[3]++;
            converted++;
            console.log(`Converted tile ${i} (n=${raceTiles[i].n}) from ${oldDiff} to 3 (gap=${candidate.gapSize}, distFromEnd=${candidate.distanceFromEnd})`);
          }
          
          if (converted < shortfall) {
            console.warn(`Only converted ${converted}/${shortfall} tiles to hard - may not meet MIN_HARD_TILES due to consecutive limits`);
          }
        }

        // Log assignment summary
        console.log(`\n=== ASSIGNMENT COMPLETE: ${raceTiles.length} tiles assigned ===`);
        console.log(`Counts: Easy=${counts[1]}, Medium=${counts[2]}, Hard=${counts[3]}`);
        
        // FINAL VALIDATION: Check for consecutive tile violations
        console.log("\n=== FINAL VALIDATION ===");
        let maxConsecutive = 0;
        let consecutiveViolations: string[] = [];
        let hardGapViolations: string[] = [];
        
        for (let i = 0; i < raceTiles.length; i++) {
          const currentDiff = raceTiles[i].difficulty;
          let consecutive = 1;
          for (let j = i - 1; j >= 0 && raceTiles[j]?.difficulty === currentDiff; j--) {
            consecutive++;
          }
          
          if (consecutive > maxConsecutive) {
            maxConsecutive = consecutive;
          }
          
          if (consecutive >= 4) {
            consecutiveViolations.push(`Tile ${i} (n=${raceTiles[i].n}): ${consecutive} consecutive difficulty ${currentDiff}`);
          }
          
          // Check hard tile gaps
          if (currentDiff !== 3) {
            let gapSinceHard = 0;
            for (let j = i - 1; j >= 0; j--) {
              if (raceTiles[j]?.difficulty === 3) break;
              gapSinceHard++;
            }
            if (gapSinceHard > 7) {
              hardGapViolations.push(`Tile ${i} (n=${raceTiles[i].n}): ${gapSinceHard} tiles since last hard`);
            }
          }
        }
        
        console.log(`Max consecutive: ${maxConsecutive}`);
        if (consecutiveViolations.length > 0) {
          console.error(`CONSECUTIVE VIOLATIONS FOUND:`, consecutiveViolations);
        }
        if (hardGapViolations.length > 0) {
          console.error(`HARD GAP VIOLATIONS FOUND:`, hardGapViolations);
        }
        
        console.log(`\\nPool availability check:`);
        console.log(`Easy: need ${counts[1]}, have ${available[1]}, remaining after: ${available[1] - counts[1] - MIN_REMAINING}`);
        console.log(`Medium: need ${counts[2]}, have ${available[2]}, remaining after: ${available[2] - counts[2] - MIN_REMAINING}`);
        console.log(`Hard: need ${counts[3]}, have ${available[3]}, remaining after: ${available[3] - counts[3] - MIN_REMAINING}`);
        
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
        
        console.log(`Warnings after pool check: ${warnings.length}`);
        
        // Add validation violations to warnings
        if (consecutiveViolations.length > 0) {
          warnings.push(`RULE VIOLATION: ${consecutiveViolations.length} consecutive tile violations`);
        }
        if (hardGapViolations.length > 0) {
          warnings.push(`RULE VIOLATION: ${hardGapViolations.length} hard gap violations`);
        }

        // If there are warnings, stop and show error
        if (warnings.length > 0) {
          console.error(`⚠️ RANDOMIZATION FAILED - clearing tiles and resetting pools`);
          console.error(`Warnings:`, warnings);
          
          // Clear tile task assignments AND difficulties
          const clearedTiles = workingState.raceTiles.map(tile => ({
            ...tile,
            difficulty: 1 as 1 | 2 | 3,
            label: "",
            instructions: "",
            image: "",
            maxCompletions: 1,
            minCompletions: 1
          }));
          
          // Reset all pool "used" flags
          const clearedPools = { ...workingState.taskPools };
          if (clearedPools["1"]) {
            clearedPools["1"] = clearedPools["1"].map(t => ({ ...t, used: false }));
          }
          if (clearedPools["2"]) {
            clearedPools["2"] = clearedPools["2"].map(t => ({ ...t, used: false }));
          }
          if (clearedPools["3"]) {
            clearedPools["3"] = clearedPools["3"].map(t => ({ ...t, used: false }));
          }
          
          let errorState: GameState = { 
            ...workingState, 
            raceTiles: clearedTiles,
            taskPools: clearedPools,
            fogOfWarDisabled: "all",
            usedPoolTaskIds: []
          };
          
          const revealedTiles: number[] = [];
          for (let i = 1; i <= MAX_TILE; i++) {
            revealedTiles.push(i);
          }
          errorState.revealedTiles = revealedTiles;
          errorState = addLog(errorState, `⚠️ ERROR: Cannot randomize difficulties - ${warnings.join(", ")} - Tiles cleared, pools reset. Fix issues and try again.`);
          return errorState;
        }
        
        console.log(`✓ Validation passed - proceeding with tile randomization`);

        let next: GameState = { ...workingState, raceTiles, gradientSettings };
        next.usedPoolTaskIds = [];
        
        const logMsg = `Admin randomized difficulties (E:${counts[1]} M:${counts[2]} H:${counts[3]}, pools: ${available[1] - counts[1]}/${available[2] - counts[2]}/${available[3] - counts[3]} remaining)`;
        
        next = addLog(next, logMsg);
        
        // Now randomize tile assignments based on the new difficulties
        // Use the already cleared taskPools from above
        const usedPoolTaskIds = new Set<string>();
        
        const tileWarnings: string[] = [];
        const unfilledTiles: number[] = [];
        
        const finalRaceTiles = next.raceTiles.map((tile) => {
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
          tileWarnings.push(`Could not fill ${unfilledTiles.length} tile(s): ${unfilledTiles.join(", ")}`);
        }
        
        next = { 
          ...next, 
          raceTiles: finalRaceTiles, 
          taskPools, 
          usedPoolTaskIds: Array.from(usedPoolTaskIds)
        };
        
        // If there are tile assignment warnings, reveal all tiles and log error
        if (tileWarnings.length > 0) {
          const revealedTiles: number[] = [];
          for (let i = 1; i <= MAX_TILE; i++) {
            revealedTiles.push(i);
          }
          next = { 
            ...next, 
            revealedTiles,
            fogOfWarDisabled: "all"
          };
          next = addLog(
            next, 
            `⚠️ ERROR: Tile randomization failed - ${tileWarnings.join(", ")} - Fog of war disabled`
          );
        } else {
          next = addLog(next, `Admin randomized tiles from pools (assigned ${finalRaceTiles.length} tasks)`);
        }
        
        return next;
      }

      case "ADMIN_SAVE_GRADIENT_SETTINGS": {
        const gradientSettings = {
          weights: { easy: 50, medium: 35, hard: 15 }, // Not used, for backward compatibility  
          gradient: true,
          early: event.early || { easy: 65, medium: 30, hard: 5 },
          late: event.late || { easy: 5, medium: 39, hard: 56 },
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

      case "ADMIN_TOGGLE_COOLDOWN": {
        const team = game.teams.find((t) => t.id === event.teamId);
        if (!team) return game;
        
        const oldState = team.powerupCooldown;
        const newState = !oldState;
        const teams = game.teams.map((t) => 
          t.id === event.teamId ? { ...t, powerupCooldown: newState } : t
        );
        
        return addLog(
          { ...game, teams },
          `Admin changed powerup cooldown for ${team.name}: ${oldState ? "ON" : "OFF"} → ${newState ? "ON" : "OFF"}`
        );
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
        const oldTeam = game.teams.find((t) => t.id === event.teamId);
        const teams = game.teams.map((t) => {
          if (t.id === event.teamId) {
            return { ...t, ...event.updates };
          }
          return t;
        });
        let next = { ...game, teams };
        const team = teams.find((t) => t.id === event.teamId);
        
        // Build change description
        const changes: string[] = [];
        if (oldTeam && event.updates) {
          for (const [key, newValue] of Object.entries(event.updates)) {
            const oldValue = (oldTeam as any)[key];
            if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
              if (key === "inventory") {
                const oldLen = Array.isArray(oldValue) ? oldValue.length : 0;
                const newLen = Array.isArray(newValue) ? (newValue as any[]).length : 0;
                changes.push(`inventory: ${oldLen} items → ${newLen} items`);
              } else if (key === "pos") {
                changes.push(`position: ${oldValue} → ${newValue}`);
              } else if (key === "powerupCooldown") {
                changes.push(`cooldown: ${oldValue ? "ON" : "OFF"} → ${newValue ? "ON" : "OFF"}`);
              } else {
                changes.push(`${key}: ${JSON.stringify(oldValue)} → ${JSON.stringify(newValue)}`);
              }
            }
          }
        }
        
        const changeDesc = changes.length > 0 ? ` (${changes.join(", ")})` : "";
        next = addLog(next, `Admin updated team ${team?.name || "Unknown"}${changeDesc}`);
        return next;
      }

      case "ADMIN_UPDATE_POWERUP_TILE": {
        const oldTile = (game.powerupTiles || []).find((t) => t.id === event.tileId);
        const powerupTiles = (game.powerupTiles || []).map((t) => {
          if (t.id === event.tileId) {
            return { ...t, ...event.updates };
          }
          return t;
        });
        
        let teams = game.teams;
        // Update team claims if provided
        if (event.teamClaims && Array.isArray(event.teamClaims)) {
          teams = game.teams.map((team) => {
            const claimUpdate = event.teamClaims!.find((c: any) => c.teamId === team.id);
            if (claimUpdate) {
              const claimedPowerupTiles = team.claimedPowerupTiles || [];
              const hasClaim = claimedPowerupTiles.includes(event.tileId);
              
              if (claimUpdate.claimed && !hasClaim) {
                // Add claim
                return { ...team, claimedPowerupTiles: [...claimedPowerupTiles, event.tileId] };
              } else if (!claimUpdate.claimed && hasClaim) {
                // Remove claim
                return { ...team, claimedPowerupTiles: claimedPowerupTiles.filter((id) => id !== event.tileId) };
              }
            }
            return team;
          });
        }
        
        let next = { ...game, powerupTiles, teams };
        const tile = powerupTiles.find((t) => t.id === event.tileId);
        
        // Build change description
        const changes: string[] = [];
        if (oldTile && event.updates) {
          for (const [key, newValue] of Object.entries(event.updates)) {
            const oldValue = (oldTile as any)[key];
            if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
              changes.push(`${key}: ${JSON.stringify(oldValue)} → ${JSON.stringify(newValue)}`);
            }
          }
        }
        
        const changeDesc = changes.length > 0 ? ` (${changes.join(", ")})` : "";
        next = addLog(next, `Admin updated powerup tile ${tile?.label || "Unknown"}${changeDesc}`);
        return next;
      }

      case "ADMIN_UPDATE_POOL_TASK": {
        const taskPools = { ...game.taskPools };
        let updated = false;
        let updatedTask: PoolTask | undefined;
        let oldTask: PoolTask | undefined;
        
        for (const difficulty of [1, 2, 3]) {
          if (taskPools[difficulty]) {
            taskPools[difficulty] = taskPools[difficulty].map((t) => {
              if (t.id === event.taskId) {
                updated = true;
                oldTask = t;
                updatedTask = { ...t, ...event.updates };
                return updatedTask;
              }
              return t;
            });
          }
        }
        
        if (!updated) return game;
        
        let next = { ...game, taskPools };
        
        // Build change description
        const changes: string[] = [];
        if (oldTask && event.updates) {
          for (const [key, newValue] of Object.entries(event.updates)) {
            const oldValue = (oldTask as any)[key];
            if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
              changes.push(`${key}: ${JSON.stringify(oldValue)} → ${JSON.stringify(newValue)}`);
            }
          }
        }
        
        const changeDesc = changes.length > 0 ? ` (${changes.join(", ")})` : "";
        next = addLog(next, `Admin updated pool task ${updatedTask?.label || "Unknown"}${changeDesc}`);
        return next;
      }

      case "CLAIM_POWERUP_TILE": {
        const team = game.teams.find((t) => t.id === event.teamId);
        const tile = (game.powerupTiles || []).find((pt) => pt.id === event.powerTileId);
        if (!team || !tile) return game;

        // Validate claim type
        const alreadyClaimed = (team.claimedPowerupTiles || []).includes(tile.id);
        if (tile.claimType === "eachTeam" && alreadyClaimed) {
          return addLog(game, `⚠️ ${team.name} already claimed this powerup`);
        }
        
        if (tile.claimType === "firstTeam") {
          const otherTeamClaimed = game.teams.some(
            (t) => t.id !== team.id && (t.claimedPowerupTiles || []).includes(tile.id)
          );
          if (otherTeamClaimed) {
            return addLog(game, `⚠️ Another team already claimed this powerup`);
          }
        }

        // Validate reward exists
        if (!tile.rewardPowerupId) {
          return addLog(game, `⚠️ Cannot claim: powerup tile has no reward`);
        }

        // Validate player names
        if (!event.playerNames || event.playerNames.length === 0) {
          return addLog(game, `⚠️ Cannot claim: no players selected`);
        }

        const minCompletions = tile.minCompletions || 1;
        const maxCompletions = tile.maxCompletions || 1;
        if (event.playerNames.length < minCompletions || event.playerNames.length > maxCompletions) {
          return addLog(
            game,
            `⚠️ Cannot claim: must have ${minCompletions}-${maxCompletions} completions`
          );
        }

        // Update team: add claimed tile, award points, give powerup
        let next = { ...game };
        next.teams = next.teams.map((t) => {
          if (t.id !== team.id) return t;

          const updatedTeam = { ...t };
          
          // Add to claimed powerup tiles
          updatedTeam.claimedPowerupTiles = [
            ...(t.claimedPowerupTiles || []),
            tile.id,
          ];

          // Award points to players
          const pointsPerCompletion = tile.pointsPerCompletion || 1;
          const updatedPlayerPoints = { ...t.playerPoints };
          event.playerNames.forEach((playerName: string) => {
            updatedPlayerPoints[playerName] = (updatedPlayerPoints[playerName] || 0) + pointsPerCompletion;
          });
          updatedTeam.playerPoints = updatedPlayerPoints;

          // Add powerup to inventory
          updatedTeam.inventory = [...(t.inventory || []), tile.rewardPowerupId];

          return updatedTeam;
        });

        // Log the event
        const playerList = event.playerNames.join(", ");
        const powerupName = powerupLabel(tile.rewardPowerupId);
        const pointsPerPlayer = tile.pointsPerCompletion || 1;
        next = addLog(
          next,
          `${team.name} gained ${powerupName}\n${playerList} completed "${tile.label}" (+${pointsPerPlayer} pts each)`
        );

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
