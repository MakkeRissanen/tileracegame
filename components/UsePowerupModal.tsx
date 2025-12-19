"use client";

import { useState } from "react";
import { GameState, Team, RaceTile, POWERUP_DEFS, MAX_TILE } from "@/types/game";
import { Button, Modal, selectClass } from "./ui";

interface UsePowerupModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team;
  game: GameState;
  isDark: boolean;
  onUsePowerup: (powerupId: string, data: any) => void;
}

export default function UsePowerupModal({
  isOpen,
  onClose,
  team,
  game,
  isDark,
  onUsePowerup,
}: UsePowerupModalProps) {
  const [selectedPowerup, setSelectedPowerup] = useState<string>("");
  const [targetTeamId, setTargetTeamId] = useState<string>("");
  const [targetPowerupId, setTargetPowerupId] = useState<string>("");
  const [selectedTile, setSelectedTile] = useState<number | null>(null);
  const [changeTaskId, setChangeTaskId] = useState<string>("");

  const powerupDef = POWERUP_DEFS.find((p) => p.id === selectedPowerup);
  const inventory = team.inventory || [];
  const uniquePowerups = Array.from(new Set(inventory));

  const revealedTiles = new Set(game.revealedTiles || []);
  const changedTiles = new Set(game.changedTiles || []);
  const doubledTiles = new Set(
    Object.keys(game.doubledTilesInfo || {}).map((k) => Number(k))
  );

  const getRaceTile = (n: number): RaceTile => {
    return (
      game.raceTiles.find((t) => t.n === n) || {
        n,
        label: `Task ${n}`,
        difficulty: 1,
        instructions: "",
        image: "",
        rewardPowerupId: null,
        maxCompletions: 1,
        minCompletions: 1,
      }
    );
  };

  const getTileDifficulty = (n: number): 1 | 2 | 3 => {
    const tile = getRaceTile(n);
    return (tile.difficulty || 1) as 1 | 2 | 3;
  };

  const canSelectTile = (tileNum: number): { allowed: boolean; reason?: string } => {
    if (!revealedTiles.has(tileNum)) {
      return { allowed: false, reason: "Hidden" };
    }

    const teamOnTile = game.teams?.some((t) => t.pos === tileNum);

    if (selectedPowerup === "copypaste") {
      if (teamOnTile) return { allowed: false, reason: "Team on tile" };
      if (tileNum === team.pos) return { allowed: false, reason: "Current tile" };
      
      const currentDiff = getTileDifficulty(team.pos);
      const targetDiff = getTileDifficulty(tileNum);
      if (targetDiff > currentDiff) {
        return { allowed: false, reason: "Higher difficulty" };
      }
      
      const targetTile = getRaceTile(tileNum);
      if (targetTile.rewardPowerupId) {
        return { allowed: false, reason: "Has reward powerup" };
      }
    } else if (selectedPowerup === "changeTile") {
      if (teamOnTile) return { allowed: false, reason: "Team on tile" };
      if (tileNum === MAX_TILE) return { allowed: false, reason: "Final tile" };
      if (changedTiles.has(tileNum)) return { allowed: false, reason: "Already changed" };
    } else if (selectedPowerup === "doubleEasy") {
      if (tileNum === MAX_TILE) return { allowed: false, reason: "Final tile" };
      if (getTileDifficulty(tileNum) !== 1) return { allowed: false, reason: "Not easy" };
      if (doubledTiles.has(tileNum)) return { allowed: false, reason: "Already doubled" };
      if (teamOnTile) return { allowed: false, reason: "Team on tile" };
    } else if (selectedPowerup === "doubleMedium") {
      if (tileNum === MAX_TILE) return { allowed: false, reason: "Final tile" };
      if (getTileDifficulty(tileNum) !== 2) return { allowed: false, reason: "Not medium" };
      if (doubledTiles.has(tileNum)) return { allowed: false, reason: "Already doubled" };
      if (teamOnTile) return { allowed: false, reason: "Team on tile" };
    } else if (selectedPowerup === "doubleHard") {
      if (tileNum === MAX_TILE) return { allowed: false, reason: "Final tile" };
      if (getTileDifficulty(tileNum) !== 3) return { allowed: false, reason: "Not hard" };
      if (doubledTiles.has(tileNum)) return { allowed: false, reason: "Already doubled" };
      if (teamOnTile) return { allowed: false, reason: "Team on tile" };
    }

    return { allowed: true };
  };

  const handleUse = () => {
    if (!selectedPowerup) return;

    const data: any = { powerupId: selectedPowerup };

    // Add target team if needed
    if (["back1", "back2", "back3", "disablePowerup"].includes(selectedPowerup)) {
      if (!targetTeamId) {
        alert("Please select a target team");
        return;
      }
      data.targetId = targetTeamId;
    }

    // Add target powerup if needed
    if (selectedPowerup === "disablePowerup" || selectedPowerup === "doublePowerup") {
      if (!targetPowerupId) {
        alert("Please select a powerup");
        return;
      }
      data.targetPowerupId = targetPowerupId;
    }

    // Add tile selection if needed
    if (
      ["copypaste", "changeTile", "doubleEasy", "doubleMedium", "doubleHard"].includes(
        selectedPowerup
      )
    ) {
      if (selectedTile === null) {
        alert("Please select a tile");
        return;
      }
      data.futureTile = selectedTile;
    }

    // Add change task if needed
    if (selectedPowerup === "changeTile") {
      if (!changeTaskId) {
        alert("Please select a replacement task");
        return;
      }
      data.changeTaskId = changeTaskId;
    }

    onUsePowerup(selectedPowerup, data);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setSelectedPowerup("");
    setTargetTeamId("");
    setTargetPowerupId("");
    setSelectedTile(null);
    setChangeTaskId("");
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const getDifficultyColor = (diff: 1 | 2 | 3) => {
    if (isDark) {
      if (diff === 1) return "bg-emerald-900/40 border-emerald-600";
      if (diff === 2) return "bg-amber-900/40 border-amber-600";
      return "bg-purple-900/40 border-purple-600";
    } else {
      if (diff === 1) return "bg-emerald-200/80 border-emerald-500";
      if (diff === 2) return "bg-amber-200/90 border-amber-500";
      return "bg-purple-200/80 border-purple-500";
    }
  };

  // Create serpentine grid for tile picker
  const createSerpentineGrid = () => {
    const rows: (RaceTile | null)[][] = [];
    let currentRow: (RaceTile | null)[] = [];
    let rowIndex = 0;

    for (let i = 1; i <= MAX_TILE; i++) {
      const tile = getRaceTile(i);
      
      if (tile.n === MAX_TILE) {
        // Final tile spans full row
        if (currentRow.length > 0) {
          while (currentRow.length < 4) currentRow.push(null);
          rows.push(currentRow);
          currentRow = [];
        }
        rows.push([tile, null, null, null]);
        break;
      }

      currentRow.push(tile);

      if (currentRow.length === 4) {
        if (rowIndex % 2 === 1) {
          currentRow.reverse();
        }
        rows.push(currentRow);
        currentRow = [];
        rowIndex++;
      }
    }

    if (currentRow.length > 0) {
      while (currentRow.length < 4) currentRow.push(null);
      if (rowIndex % 2 === 1) {
        currentRow.reverse();
      }
      rows.push(currentRow);
    }

    return rows.flat();
  };

  const serpentineGrid = createSerpentineGrid();

  // Get available tasks for changeTile powerup
  const getAvailableTasks = () => {
    if (selectedTile === null) return [];
    const diff = getTileDifficulty(selectedTile);
    const pool = game.taskPools?.[diff] || [];
    const used = new Set(game.usedPoolTaskIds || []);
    return pool.filter((task) => !task.used && !used.has(task.id));
  };

  const availableTasks = getAvailableTasks();

  const canUse = () => {
    if (!selectedPowerup) return false;
    
    const def = POWERUP_DEFS.find((p) => p.id === selectedPowerup);
    if (!def) return false;

    if (def.kind === "target" || selectedPowerup === "disablePowerup") {
      if (!targetTeamId) return false;
    }

    if (selectedPowerup === "disablePowerup" || selectedPowerup === "doublePowerup") {
      if (!targetPowerupId) return false;
    }

    if (["copypaste", "changeTile", "doubleEasy", "doubleMedium", "doubleHard"].includes(selectedPowerup)) {
      if (selectedTile === null) return false;
      if (selectedPowerup === "changeTile" && !changeTaskId) return false;
    }

    return true;
  };

  const otherTeams = game.teams?.filter((t) => t.id !== team.id) || [];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isDark={isDark} maxWidth="max-w-4xl">
      <div className="space-y-4">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
            Use Powerup
          </h2>
          <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            {team.name}
          </p>
        </div>

        {/* Powerup Selection */}
        <div>
          <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
            Select Powerup
          </label>
          <select
            value={selectedPowerup}
            onChange={(e) => {
              setSelectedPowerup(e.target.value);
              setTargetTeamId("");
              setTargetPowerupId("");
              setSelectedTile(null);
              setChangeTaskId("");
            }}
            className={selectClass(isDark)}
          >
            <option value="">Choose a powerup...</option>
            {uniquePowerups.map((pid) => {
              const count = inventory.filter((p) => p === pid).length;
              const def = POWERUP_DEFS.find((p) => p.id === pid);
              return (
                <option key={pid} value={pid}>
                  {def?.name || pid} (x{count})
                </option>
              );
            })}
          </select>
        </div>

        {/* Target Team Selection */}
        {powerupDef && (powerupDef.kind === "target" || selectedPowerup === "disablePowerup") && (
          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
              Target Team
            </label>
            <select
              value={targetTeamId}
              onChange={(e) => setTargetTeamId(e.target.value)}
              className={selectClass(isDark)}
            >
              <option value="">Choose a team...</option>
              {otherTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Target Powerup Selection (for disablePowerup and doublePowerup) */}
        {selectedPowerup === "disablePowerup" && targetTeamId && (
          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
              Powerup to Disable
            </label>
            <select
              value={targetPowerupId}
              onChange={(e) => setTargetPowerupId(e.target.value)}
              className={selectClass(isDark)}
            >
              <option value="">Choose a powerup...</option>
              {(() => {
                const targetTeam = game.teams?.find((t) => t.id === targetTeamId);
                const targetInventory = targetTeam?.inventory || [];
                const uniqueTargetPowerups = Array.from(new Set(targetInventory));
                return uniqueTargetPowerups.map((pid) => {
                  const count = targetInventory.filter((p) => p === pid).length;
                  const def = POWERUP_DEFS.find((p) => p.id === pid);
                  return (
                    <option key={pid} value={pid}>
                      {def?.name || pid} (x{count})
                    </option>
                  );
                });
              })()}
            </select>
          </div>
        )}

        {selectedPowerup === "doublePowerup" && (
          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
              Powerup to Double
            </label>
            <select
              value={targetPowerupId}
              onChange={(e) => setTargetPowerupId(e.target.value)}
              className={selectClass(isDark)}
            >
              <option value="">Choose a powerup...</option>
              {uniquePowerups
                .filter((pid) => pid !== selectedPowerup)
                .map((pid) => {
                  const count = inventory.filter((p) => p === pid).length;
                  const def = POWERUP_DEFS.find((p) => p.id === pid);
                  return (
                    <option key={pid} value={pid}>
                      {def?.name || pid} (x{count})
                    </option>
                  );
                })}
            </select>
          </div>
        )}

        {/* Tile Picker */}
        {selectedPowerup &&
          ["copypaste", "changeTile", "doubleEasy", "doubleMedium", "doubleHard"].includes(
            selectedPowerup
          ) && (
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                Select Tile
              </label>
              <div
                className={`max-h-96 overflow-y-auto rounded-xl border p-2 ${
                  isDark ? "border-slate-600 bg-slate-900" : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="grid grid-cols-4 gap-1">
                  {serpentineGrid.map((cell, idx) => {
                    if (!cell) return <div key={`empty-${idx}`} className="w-full h-10"></div>;

                    const tile = cell;
                    const tileN = tile.n;
                    const isRevealed = revealedTiles.has(tileN);
                    const { allowed, reason } = canSelectTile(tileN);
                    const isSelected = selectedTile === tileN;
                    const isFinalTile = tileN === MAX_TILE;
                    const colSpan = isFinalTile ? "col-span-4" : "";

                    const teamsOnTile = game.teams?.filter((t) => t.pos === tileN) || [];

                    return (
                      <button
                        key={tileN}
                        onClick={() => allowed && setSelectedTile(tileN)}
                        disabled={!allowed}
                        className={`relative w-full h-10 rounded border flex items-center justify-center gap-1 font-bold text-sm transition ${colSpan} ${
                          isSelected
                            ? isDark
                              ? "border-amber-500 bg-amber-900/50 text-amber-200"
                              : "border-amber-500 bg-amber-100 text-amber-900"
                            : allowed && isRevealed
                            ? `${getDifficultyColor(tile.difficulty)} hover:brightness-95 ${isDark ? "text-slate-100" : "text-slate-900"}`
                            : !isRevealed
                            ? isDark
                              ? "border-slate-700 bg-slate-900/50 text-slate-600"
                              : "border-slate-200 bg-slate-100 text-slate-400"
                            : isDark
                            ? "border-slate-700 bg-slate-900/50 text-slate-600 cursor-not-allowed"
                            : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                        }`}
                        title={allowed ? `Tile ${tileN}` : reason}
                      >
                        {isRevealed ? (
                          <>
                            <span>{tileN}</span>
                            {teamsOnTile.length > 0 && (
                              <div className="absolute top-0.5 right-0.5 flex gap-0.5">
                                {teamsOnTile.map((t, i) => (
                                  <div
                                    key={i}
                                    className={`w-2 h-2 rounded-full border border-white/50 ${t.color}`}
                                    title={t.name}
                                  ></div>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-xl">?</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        {/* Change Task Selection */}
        {selectedPowerup === "changeTile" && selectedTile !== null && (
          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
              Replace with (unused task from pool)
            </label>
            <select
              value={changeTaskId}
              onChange={(e) => setChangeTaskId(e.target.value)}
              className={selectClass(isDark)}
              disabled={availableTasks.length === 0}
            >
              <option value="">
                {availableTasks.length === 0 ? "No unused tasks available" : "Choose a task..."}
              </option>
              {availableTasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button onClick={handleClose} variant="secondary" isDark={isDark} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleUse}
            variant="primary"
            isDark={isDark}
            disabled={!canUse()}
            className="flex-1"
          >
            Use Powerup
          </Button>
        </div>
      </div>
    </Modal>
  );
}
