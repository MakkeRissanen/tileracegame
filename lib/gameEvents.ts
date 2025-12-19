import {
  GameState,
  GameEvent,
  MAX_TILE,
  Team,
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

/**
 * Core event handler - applies an event to the game state
 * This is a pure function that returns a new game state
 */
export function applyEvent(game: GameState, event: GameEvent): GameState {
  try {
    switch (event.type) {
      case "RESET_ALL": {
        return addLog(initialGame(), "Game reset.");
      }

      case "ADD_TEAM": {
        if (!event.adminName) return game;
        const name = (event.name || "").trim();
        if (!name) return game;

        const idx = game.teams.length;
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

        let next = { ...game, teams: [...game.teams, team] };
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
        const item = { id: uid(), label: text, instructions: "", image: "" };
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

      default:
        return game;
    }
  } catch (error) {
    console.error("Error applying event:", error);
    return addLog(game, `Error: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
