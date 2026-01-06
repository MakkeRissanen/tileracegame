import {
  GameState,
  MAX_TILE,
  LogEntry,
} from "@/types/game";
import {
  addLog,
  clamp,
  getRaceTile,
  tileLabel,
  tileDiff,
  tileDesc,
  simulateAdvance,
  powerupLabel,
} from "./gameUtils";

/**
 * Helper to consume a powerup from team's inventory and set cooldown
 */
function consumePowerup(gameState: GameState, teamId: string, powerupId: string): GameState {
  const teamsConsumed = gameState.teams.map((t) => {
    if (t.id !== teamId) return t;
    const nextInv = [...(t.inventory || [])];
    const i = nextInv.indexOf(powerupId);
    if (i >= 0) nextInv.splice(i, 1);
    return { ...t, inventory: nextInv, powerupCooldown: 1 };
  });
  return { ...gameState, teams: teamsConsumed };
}

/**
 * Helper to update revealed tiles based on current team positions
 * Uses the same dynamic vision logic as COMPLETE_RACE_TILE
 */
function updateVision(gameState: GameState): GameState {
  const revealedTiles = new Set(gameState.revealedTiles || []);
  
  // Always reveal tile 1 (starting tile)
  revealedTiles.add(1);

  // Find farthest team position
  let farthestPos = 1;
  gameState.teams.forEach((team) => {
    if (team.pos > farthestPos) {
      farthestPos = team.pos;
    }
  });

  // Determine vision range based on farthest position
  // Design: Normal=5, Halfway=4, Last 15=3, Last 5=2
  let visionAhead;
  if (farthestPos >= MAX_TILE - 5) {
    visionAhead = 2; // Last 5 tiles (tile 51+): 2 tiles ahead
  } else if (farthestPos >= MAX_TILE - 15) {
    visionAhead = 3; // Last 15 tiles (tile 41+): 3 tiles ahead  
  } else if (farthestPos >= Math.floor(MAX_TILE / 2)) {
    visionAhead = 4; // Halfway point (tile 28+): 4 tiles ahead
  } else {
    visionAhead = 5; // Normal (before halfway): 5 tiles ahead
  }

  // Reveal tiles from 1 up to farthest position + vision range (shared vision for all teams)
  // But NEVER reveal the final tile until a team reaches it
  for (let i = 1; i <= Math.min(farthestPos + visionAhead, MAX_TILE - 1); i++) {
    revealedTiles.add(i);
  }
  
  // Only reveal final tile if a team has reached it
  if (farthestPos >= MAX_TILE) {
    revealedTiles.add(MAX_TILE);
  }

  return { ...gameState, revealedTiles: Array.from(revealedTiles) };
}

/**
 * Handle USE_POWERUP event
 */
export function handleUsePowerup(
  game: GameState,
  event: {
    teamId: string;
    powerupId: string;
    targetId?: string;
    futureTile?: string;
    changeTaskId?: string;
    targetPowerupId?: string;
    adminName?: string;
    oldTaskLabel?: string;
    newTaskLabel?: string;
    fromTileNumber?: number;
    toTileNumber?: number;
  }
): GameState {
  const { teamId, powerupId, targetId, futureTile, changeTaskId, targetPowerupId, adminName } = event;
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

    let next = consumePowerup(game, teamId, powerupId);
    const teams = next.teams.map((t) => (t.id === teamId ? { ...t, pos: dest } : t));
    next = { ...next, teams };
    
    // Update vision after moving forward
    next = updateVision(next);
    
    const adminPrefix = adminName ? `[${adminName}]\n` : '';
    next = addLog(
      next,
      `${adminPrefix}${team.name} used ${powerupLabel(powerupId)} (from ${tileDesc(
        next,
        before
      )} → Current: ${tileDesc(next, dest)})`
    );
    // Store from/to tile numbers for Discord
    if (event.fromTileNumber === undefined) {
      (next as any)._lastEventFromTile = before;
      (next as any)._lastEventToTile = dest;
    }
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
    let next = consumePowerup(game, teamId, powerupId);
    
    // Clear claimedRaceTileRewards for tiles between dest and before (exclusive)
    // This allows the team to re-earn rewards and points when re-completing these tiles
    const teams = next.teams.map((t) => {
      if (t.id === target.id) {
        const clearedRewards = (t.claimedRaceTileRewards || []).filter(
          (tileNum) => tileNum < dest || tileNum >= before
        );
        return { ...t, pos: dest, powerupCooldown: 1, claimedRaceTileRewards: clearedRewards };
      }
      return t;
    });
    next = { ...next, teams };
    
    // Update vision after moving backward (important!)
    next = updateVision(next);
    
    const adminPrefix = adminName ? `[${adminName}]\n` : '';
    next = addLog(
      next,
      `${adminPrefix}${team.name} used ${powerupLabel(powerupId)} on ${target.name} (from ${tileDesc(
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

    // Check if current tile has already been copied from
    const copiedFromTiles = new Set(game.copiedFromTiles || []);
    if (copiedFromTiles.has(team.pos)) {
      return addLog(
        game,
        `${team.name} cannot copy from Tile ${team.pos} because it has already been copied from.`
      );
    }

    // Check if current tile was a paste destination (cannot copy from pasted tiles)
    const copyPasteTilesSet = new Set(game.copyPasteTiles || []);
    if (copyPasteTilesSet.has(team.pos)) {
      return addLog(
        game,
        `${team.name} cannot copy from Tile ${team.pos} because it was pasted to and cannot be copied again.`
      );
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
    let next = consumePowerup(game, teamId, powerupId);

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
    
    const copyPasteTiles = Array.from(
      new Set([...(next.copyPasteTiles || []), tileN])
    );
    
    const copiedFromTilesArr = Array.from(
      new Set([...(next.copiedFromTiles || []), team.pos])
    );
    
    next = { ...next, raceTiles, teams, copyPasteTiles, copiedFromTiles: copiedFromTilesArr };
    const adminPrefix = adminName ? `[${adminName}]\n` : '';
    next = addLog(
      next,
      `${adminPrefix}${team.name} used ${powerupLabel(
        powerupId
      )} (Tile ${tileN}: "${beforeLabel}" → "${sourceTile.label}" from ${tileDesc(
        next,
        team.pos
      )})`
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

    const otherTeamOnTile = (game.teams || []).some((t) => t.pos === tileN && t.id !== teamId);
    if (otherTeamOnTile) {
      return addLog(
        game,
        `${team.name} cannot change Tile ${tileN} because another team is standing on it.`
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

    let next = consumePowerup(game, teamId, powerupId);

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
    
    // Add new task to used list, remove old task from used list (return it to pool)
    const usedSet = new Set(next.usedPoolTaskIds || []);
    usedSet.add(chosen.id);
    if (oldTaskId) {
      usedSet.delete(oldTaskId);
    }
    const usedPoolTaskIds = Array.from(usedSet);
    
    const changedTilesArr = Array.from(
      new Set([...(next.changedTiles || []), tileN])
    );

    next = { ...next, raceTiles, usedPoolTaskIds, changedTiles: changedTilesArr };
    const adminPrefix = adminName ? `[${adminName}]\n` : '';
    next = addLog(
      next,
      `${adminPrefix}${team.name} used ${powerupLabel(powerupId)} on Tile ${tileN} (D${diff}) → "${beforeLabel}" → "${
        chosen.label
      }"`
    );
    return next;
  }

  // Randomize random tile
  if (powerupId === "randomizeRandomTile") {
    // Find all eligible tiles (not altered by any powerup, not occupied, not final tile, not behind last team)
    const changedTiles = new Set(game.changedTiles || []);
    const occupiedTiles = new Set(game.teams.map(t => t.pos));
    const doubledTiles = new Set(game.doubledTiles || []);
    const copyPasteTiles = new Set(game.copyPasteTiles || []);
    const copiedFromTiles = new Set(game.copiedFromTiles || []);
    
    // Find the farthest team position
    const farthestPos = Math.max(...game.teams.map(t => t.pos), 1);
    
    // Check if a tile is visible (not hidden by fog of war)
    const isVisible = (n: number) => {
      // If fog of war is disabled for everyone, all tiles are visible
      if (game.fogOfWarDisabled === "all") return true;
      // If fog of war is disabled for admin only, all tiles are visible
      if (game.fogOfWarDisabled === "admin") return true;
      // Otherwise, check if the tile is in the revealed tiles list
      return game.revealedTiles?.includes(n) ?? false;
    };
    
    const eligibleTiles = game.raceTiles.filter(tile => 
      tile.n >= 2 && // Not tile 1
      tile.n < MAX_TILE && // Not final tile
      tile.n >= farthestPos && // Not behind the farthest team
      !changedTiles.has(tile.n) && // Not already changed
      !occupiedTiles.has(tile.n) && // Not occupied by a team
      !doubledTiles.has(tile.n) && // Not a doubled tile
      !copyPasteTiles.has(tile.n) && // Not a pasted tile
      !copiedFromTiles.has(tile.n) && // Not a copied-from tile
      isVisible(tile.n) // Only visible tiles (not hidden by fog of war)
    );

    if (eligibleTiles.length === 0) {
      return addLog(
        game,
        `${team.name} tried to use ${powerupLabel(powerupId)}, but there are no eligible tiles to randomize.`
      );
    }

    // Pick a random eligible tile
    const randomTile = eligibleTiles[Math.floor(Math.random() * eligibleTiles.length)];
    const tileN = randomTile.n;

    // Collect ALL tasks from ALL difficulty pools (can change difficulty)
    const allTasks: any[] = [];
    ['1', '2', '3'].forEach(difficulty => {
      const pool = game.taskPools?.[difficulty] || [];
      allTasks.push(...pool.map(task => ({ ...task, difficulty: Number(difficulty) })));
    });

    if (allTasks.length === 0) {
      return addLog(
        game,
        `${team.name} tried to use ${powerupLabel(powerupId)}, but there are no tasks available in any pool.`
      );
    }

    // Pick a random task from any pool (used or unused, any difficulty)
    const chosen = allTasks[Math.floor(Math.random() * allTasks.length)];

    const beforeLabel = tileLabel(game, tileN);
    const beforeDifficulty = tileDiff(game, tileN);

    let next = consumePowerup(game, teamId, powerupId);

    const raceTiles = next.raceTiles.map((rt) =>
      rt.n === tileN
        ? {
            ...rt,
            label: chosen.label,
            instructions: chosen.instructions || "",
            image: chosen.image || "",
            difficulty: chosen.difficulty as 1 | 2 | 3,
            maxCompletions: chosen.maxCompletions || 1,
            minCompletions: chosen.minCompletions || 1,
          }
        : rt
    );
    
    // Don't mark task as used - it can be reused
    const changedTilesArr = Array.from(
      new Set([...(next.changedTiles || []), tileN])
    );

    next = { ...next, raceTiles, changedTiles: changedTilesArr };
    const adminPrefix = adminName ? `[${adminName}]\n` : '';
    const difficultyChange = beforeDifficulty !== chosen.difficulty 
      ? ` (D${beforeDifficulty} → D${chosen.difficulty})`
      : ` (D${chosen.difficulty})`;
    next = addLog(
      next,
      `${adminPrefix}${team.name} used ${powerupLabel(powerupId)} on Tile ${tileN}${difficultyChange} → "${beforeLabel}" → "${chosen.label}"`
    );
    return next;
  }

  // Clear cooldown
  if (powerupId === "clearCooldown") {
    let next = consumePowerup(game, teamId, powerupId);
    const teams = next.teams.map((t) =>
      t.id === teamId ? { ...t, powerupCooldown: 0 } : t
    );
    next = { ...next, teams };
    const adminPrefix = adminName ? `[${adminName}]\n` : '';
    next = addLog(
      next,
      `${adminPrefix}${team.name} used ${powerupLabel(powerupId)} → cooldown cleared`
    );
    return next;
  }

  // Time Bomb
  if (powerupId === "timeBomb") {
    const currentTile = team.pos;
    let next = consumePowerup(game, teamId, powerupId);
    
    // Place time bomb on current tile
    const timeBombTiles = { ...next.timeBombTiles };
    timeBombTiles[currentTile] = teamId;
    next = { ...next, timeBombTiles };
    
    const adminPrefix = adminName ? `[${adminName}]\n` : '';
    const logEntry: LogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      ts: Date.now(),
      message: `${adminPrefix}${team.name} used ${powerupLabel(powerupId)} 💣 → placed time bomb on ${tileDesc(next, currentTile)}`,
      isTimeBombSecret: true,
    };
    return {
      ...next,
      log: [logEntry, ...(next.log || [])].slice(0, 50),
    };
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
    
    // Find the first non-insured index of the target powerup
    let targetIndex = -1;
    const insuredIndices = target.insuredPowerups || [];
    for (let i = 0; i < target.inventory.length; i++) {
      if (target.inventory[i] === targetPowerupId && !insuredIndices.includes(i)) {
        targetIndex = i;
        break;
      }
    }
    
    if (targetIndex === -1) {
      return addLog(
        game,
        `${team.name} tried to disable a powerup from ${target.name} but target doesn't have an uninsured copy.`
      );
    }
    
    let next = consumePowerup(game, teamId, powerupId);
    const teams = next.teams.map((t) => {
      if (t.id !== target.id) return t;
      const nextInv = [...(t.inventory || [])];
      nextInv.splice(targetIndex, 1);
      
      // Update insured indices after removal
      const insuredPowerups = (t.insuredPowerups || [])
        .filter(idx => idx !== targetIndex) // Remove insurance for this powerup
        .map(idx => idx > targetIndex ? idx - 1 : idx); // Adjust indices after removal
      
      return { ...t, inventory: nextInv, insuredPowerups };
    });
    next = { ...next, teams };
    const adminPrefix = adminName ? `[${adminName}]\n` : '';
    next = addLog(
      next,
      `${adminPrefix}${team.name} used ${powerupLabel(powerupId)} on ${
        target.name
      } → removed ${powerupLabel(targetPowerupId)}`
    );
    return next;
  }

  // Steal powerup
  if (powerupId === "stealPowerup") {
    const target = game.teams.find((t) => t.id === targetId);
    if (!target || target.id === teamId || !targetPowerupId) {
      return addLog(
        game,
        `${team.name} tried to use ${powerupLabel(powerupId)} but invalid target.`
      );
    }
    
    // Check if target is ahead (higher position)
    if (target.pos <= team.pos) {
      return addLog(
        game,
        `${team.name} tried to steal from ${target.name} but can only steal from teams ahead of you.`
      );
    }
    
    // Find the first non-insured index of the target powerup
    let targetIndex = -1;
    const insuredIndices = target.insuredPowerups || [];
    for (let i = 0; i < target.inventory.length; i++) {
      if (target.inventory[i] === targetPowerupId && !insuredIndices.includes(i)) {
        targetIndex = i;
        break;
      }
    }
    
    if (targetIndex === -1) {
      return addLog(
        game,
        `${team.name} tried to steal a powerup from ${target.name} but target doesn't have an uninsured copy.`
      );
    }
    
    let next = consumePowerup(game, teamId, powerupId);
    const stolenPowerup = targetPowerupId;
    const teams = next.teams.map((t) => {
      if (t.id === target.id) {
        // Remove from target
        const nextInv = [...(t.inventory || [])];
        nextInv.splice(targetIndex, 1);
        
        // Update insured indices after removal
        const insuredPowerups = (t.insuredPowerups || [])
          .filter(idx => idx !== targetIndex) // Remove insurance for this powerup
          .map(idx => idx > targetIndex ? idx - 1 : idx); // Adjust indices after removal
        
        return { ...t, inventory: nextInv, insuredPowerups };
      } else if (t.id === teamId) {
        // Add to stealer
        return { ...t, inventory: [...(t.inventory || []), stolenPowerup] };
      }
      return t;
    });
    next = { ...next, teams };
    const adminPrefix = adminName ? `[${adminName}]\n` : '';
    next = addLog(
      next,
      `${adminPrefix}${team.name} used ${powerupLabel(powerupId)} on ${
        target.name
      } → stole ${powerupLabel(stolenPowerup)}`
    );
    return next;
  }

  // Cooldown Lock
  if (powerupId === "cooldownLock") {
    const target = game.teams.find((t) => t.id === targetId);
    if (!target || target.id === teamId) {
      return addLog(
        game,
        `${team.name} tried to use ${powerupLabel(powerupId)} but invalid target.`
      );
    }
    
    let next = consumePowerup(game, teamId, powerupId);
    const teams = next.teams.map((t) => {
      if (t.id === target.id) {
        // Add 2 tiles to their cooldown
        return { ...t, powerupCooldown: t.powerupCooldown + 2 };
      }
      return t;
    });
    next = { ...next, teams };
    const adminPrefix = adminName ? `[${adminName}]\n` : '';
    next = addLog(
      next,
      `${adminPrefix}${team.name} used ${powerupLabel(powerupId)} on ${
        target.name
      } → cooldown locked for +2 tiles`
    );
    return next;
  }

  // Double powerup
  if (powerupId === "doublePowerup") {
    if (!targetPowerupId || !(team.inventory || []).includes(targetPowerupId)) {
      return addLog(game, `${team.name} tried to double a powerup they don't have.`);
    }
    let next = consumePowerup(game, teamId, powerupId);
    const teams = next.teams.map((t) => {
      if (t.id !== teamId) return t;
      return { ...t, inventory: [...(t.inventory || []), targetPowerupId] };
    });
    next = { ...next, teams };
    const adminPrefix = adminName ? `[${adminName}]\n` : '';
    next = addLog(
      next,
      `${adminPrefix}${team.name} used ${powerupLabel(powerupId)} → doubled ${powerupLabel(
        targetPowerupId
      )}`
    );
    return next;
  }

  // Powerup Insurance
  if (powerupId === "powerupInsurance") {
    const insurePowerupIndex = (event as any).insurePowerupIndex;
    if (insurePowerupIndex === undefined || insurePowerupIndex < 0 || insurePowerupIndex >= team.inventory.length) {
      return addLog(game, `${team.name} tried to insure a powerup but invalid selection.`);
    }
    const targetPowerup = team.inventory[insurePowerupIndex];
    
    let next = consumePowerup(game, teamId, powerupId);
    const teams = next.teams.map((t) => {
      if (t.id !== teamId) return t;
      const insuredPowerups = [...(t.insuredPowerups || [])];
      if (!insuredPowerups.includes(insurePowerupIndex)) {
        insuredPowerups.push(insurePowerupIndex);
      }
      return { ...t, insuredPowerups };
    });
    next = { ...next, teams };
    const adminPrefix = adminName ? `[${adminName}]\n` : '';
    next = addLog(
      next,
      `${adminPrefix}${team.name} used ${powerupLabel(powerupId)} → insured ${powerupLabel(targetPowerup)}`
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

    let next = consumePowerup(game, teamId, powerupId);
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
    const adminPrefix = adminName ? `[${adminName}]\n` : '';
    next = addLog(
      next,
      `${adminPrefix}${team.name} used ${powerupLabel(powerupId)} on ${tileDesc(
        next,
        tileN
      )} → requirement doubled to ${updatedTile?.maxCompletions} (min: ${
        updatedTile?.minCompletions
      })`
    );
    return next;
  }

  // Mystery Powerup - Lootbox
  if (powerupId === "mysteryPowerup") {
    const possibleRewards = [
      "skip1",
      "back1",
      "powerupInsurance",
      "stealPowerup",
      "cooldownLock",
      "randomizeRandomTile",
      "clearCooldown"
    ];
    
    const randomReward = possibleRewards[Math.floor(Math.random() * possibleRewards.length)];
    
    // Consume the mystery powerup
    let next = consumePowerup(game, teamId, powerupId);
    
    // Add the reward to inventory
    const teams = next.teams.map((t) =>
      t.id === teamId ? { ...t, inventory: [...t.inventory, randomReward] } : t
    );
    next = { ...next, teams };
    
    const adminPrefix = adminName ? `[${adminName}]\n` : '';
    next = addLog(
      next,
      `${adminPrefix}${team.name} used ${powerupLabel(powerupId)} and received ${powerupLabel(randomReward)}! 🎁`
    );
    return next;
  }

  return game;
}
