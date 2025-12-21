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
  const copyPasteTiles = new Set(game.copyPasteTiles || []);
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
      
      if (changedTiles.has(tileNum)) return { allowed: false, reason: "Already changed" };
      // Note: Doubled tiles CAN be copied (retaliate mechanic)
    } else if (selectedPowerup === "changeTile") {
      if (teamOnTile) return { allowed: false, reason: "Team on tile" };
      if (tileNum === MAX_TILE) return { allowed: false, reason: "Final tile" };
      if (changedTiles.has(tileNum)) return { allowed: false, reason: "Already changed" };
      if (copyPasteTiles.has(tileNum)) return { allowed: false, reason: "Already copied" };
      if (doubledTiles.has(tileNum)) return { allowed: false, reason: "Already doubled" };
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
      if (diff === 1) return "bg-emerald-800 border-emerald-400";
      if (diff === 2) return "bg-amber-800 border-amber-400";
      return "bg-purple-800 border-purple-400";
    } else {
      if (diff === 1) return "bg-emerald-800 border-emerald-400";
      if (diff === 2) return "bg-amber-800 border-amber-400";
      return "bg-purple-800 border-purple-400";
    }
  };

  // Create serpentine layout matching RaceBoard
  const createSerpentineLayout = () => {
    const rows: { tiles: RaceTile[]; isReversed: boolean }[] = [];
    let currentIndex = 0;
    
    while (currentIndex < game.raceTiles.length) {
      const rowNumber = rows.length;
      
      // First row and every other pair of rows: 4 tiles left-to-right
      if (rowNumber % 4 === 0) {
        const tiles = game.raceTiles.slice(currentIndex, currentIndex + 4);
        rows.push({ tiles, isReversed: false });
        currentIndex += 4;
      }
      // Second row: 1 tile on the right (continuing from previous row)
      else if (rowNumber % 4 === 1) {
        const tiles = game.raceTiles.slice(currentIndex, currentIndex + 1);
        rows.push({ tiles, isReversed: false });
        currentIndex += 1;
      }
      // Third row: 4 tiles right-to-left
      else if (rowNumber % 4 === 2) {
        const tiles = game.raceTiles.slice(currentIndex, currentIndex + 4);
        rows.push({ tiles, isReversed: true });
        currentIndex += 4;
      }
      // Fourth row: 1 tile on the left (continuing from previous row)
      else {
        const tiles = game.raceTiles.slice(currentIndex, currentIndex + 1);
        rows.push({ tiles, isReversed: true });
        currentIndex += 1;
      }
    }
    
    return rows;
  };

  const serpentineRows = createSerpentineLayout();

  // Get available tasks for changeTile powerup
  const getAvailableTasks = () => {
    if (selectedTile === null) return [];
    const diff = getTileDifficulty(selectedTile);
    const pool = game.taskPools?.[String(diff)] || [];
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
    <Modal isOpen={isOpen} onClose={handleClose} isDark={isDark} maxWidth="max-w-4xl" zIndex="z-[60]">
      <div className="flex flex-col" style={{ maxHeight: 'calc(85vh - 100px)' }}>

        {/* Scrollable Content Area */}
        <div className="overflow-y-auto flex-1 px-1 pr-3 space-y-4 min-h-0"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: isDark ? '#475569 #1e293b' : '#cbd5e1 #f1f5f9'
          }}
        >

        {/* Powerup Selection */}
        <div className="relative z-50 mb-2">
          <label className={`block text-xl font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
            Select Powerup to Use
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
          
          {/* Powerup Description */}
          {selectedPowerup && powerupDef?.description && (
            <div className={`mt-2 p-3 rounded-lg text-sm ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
              {powerupDef.description}
            </div>
          )}
        </div>

        {/* Target Team Selection */}
        {powerupDef && (powerupDef.kind === "target" || selectedPowerup === "disablePowerup") && (
          <div className="relative z-40 mb-2">
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
          <div className="relative z-30 mb-2">
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
          <div className="relative z-30 mb-2">
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
                className={`max-h-none overflow-visible rounded-xl border p-3 space-y-3 ${
                  isDark ? "border-slate-600 bg-slate-900" : "border-slate-200 bg-slate-50"
                }`}
              >
                {serpentineRows.map((row, rowIndex) => {
                  const rowType = rowIndex % 4;
                  const tilesToRender = row.isReversed ? [...row.tiles].reverse() : row.tiles;
                  
                  return (
                    <div key={rowIndex} className="grid grid-cols-4 gap-3">
                      {/* Empty cells for alignment */}
                      {rowType === 1 && (
                        <>
                          <div></div>
                          <div></div>
                          <div></div>
                        </>
                      )}
                      
                      {tilesToRender.map((tile) => {
                        const tileN = tile.n;
                        const isRevealed = revealedTiles.has(tileN);
                        const { allowed, reason } = canSelectTile(tileN);
                        const isSelected = selectedTile === tileN;
                        const isFinalTile = tileN === MAX_TILE;
                        const teamsOnTile = game.teams?.filter((t) => t.pos === tileN) || [];

                        return (
                          <button
                            key={tileN}
                            onClick={() => allowed && setSelectedTile(tileN)}
                            disabled={!allowed}
                            className={`
                              ${isFinalTile ? "col-span-4" : "col-span-1"}
                              ${isFinalTile ? "h-32" : "h-24"}
                              ${isSelected 
                                ? isDark 
                                  ? "border-amber-500 bg-amber-900/50 ring-2 ring-amber-400" 
                                  : "border-amber-500 bg-amber-100 ring-2 ring-amber-400"
                                : isRevealed && allowed
                                ? `${getDifficultyColor(tile.difficulty)} hover:shadow-xl hover:scale-105`
                                : !isRevealed
                                ? isDark
                                  ? "bg-slate-800 border-slate-700"
                                  : "bg-slate-700 border-slate-600"
                                : isDark
                                ? "bg-slate-800 border-slate-700 opacity-50"
                                : "bg-slate-700 border-slate-600 opacity-50"
                              }
                              border-2 rounded-xl shadow-lg
                              relative overflow-hidden
                              transition-all duration-200
                              ${allowed && isRevealed ? "cursor-pointer" : "cursor-not-allowed"}
                            `}
                            title={allowed ? `Tile ${tileN}` : reason}
                          >
                            {/* Tile Number */}
                            <div className={`absolute top-1 left-2 text-xs font-mono ${isRevealed ? "text-white" : isDark ? "text-slate-400" : "text-slate-500"}`}>
                              {tileN}
                            </div>

                            {/* Powerup Badge */}
                            {isRevealed && tile.rewardPowerupId && (
                              <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-xs font-bold ${isDark ? "bg-yellow-900/60 text-yellow-100" : "bg-yellow-200 text-yellow-900"}`}>
                                PWR
                              </div>
                            )}

                            {/* Tile Content */}
                            <div className="flex flex-col items-center justify-center h-full px-2 py-1">
                              {!isRevealed ? (
                                <div className={`text-3xl ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                                  ?
                                </div>
                              ) : (
                                <>
                                  {tile.image && (
                                    <img
                                      src={tile.image}
                                      alt=""
                                      className="w-12 h-12 object-contain mb-1"
                                    />
                                  )}
                                  <p className={`text-center text-xs font-semibold line-clamp-2 text-white mt-1`}>
                                    {tile.label}
                                  </p>
                                </>
                              )}
                            </div>

                            {/* Status Badges */}
                            {isRevealed && (
                              <div className="absolute bottom-1 right-1 flex gap-1">
                                {copyPasteTiles.has(tileN) && (
                                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold shadow-lg border-2 ${isDark ? "bg-blue-600 text-white border-blue-400" : "bg-blue-500 text-white border-blue-300"}`}>
                                    Copied
                                  </span>
                                )}
                                {changedTiles.has(tileN) && (
                                  <span className={`px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg border-2 ${isDark ? "bg-purple-600 text-white border-purple-400" : "bg-purple-500 text-white border-purple-300"}`}>
                                    🔄
                                  </span>
                                )}
                                {doubledTiles.has(tileN) && (
                                  <span className={`px-3 py-1.5 rounded-lg text-lg font-bold shadow-lg border-2 ${isDark ? "bg-orange-600 text-white border-orange-400" : "bg-orange-500 text-white border-orange-300"}`}>
                                    2×
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Team Position Markers */}
                            {teamsOnTile.length > 0 && (
                              <div className="absolute bottom-1 left-1 flex flex-col gap-0.5">
                                {teamsOnTile.slice(0, 3).map((t) => (
                                  <div
                                    key={t.id}
                                    className={`px-1.5 py-0.5 rounded-full text-xs font-medium text-white ${t.color}`}
                                    style={{
                                      transform: teamsOnTile.length > 1 ? 'scale(0.75)' : undefined,
                                    }}
                                  >
                                    {t.name}
                                  </div>
                                ))}
                              </div>
                            )}
                          </button>
                        );
                      })}
                      
                      {/* Empty cells for single-tile rows */}
                      {rowType === 3 && (
                        <>
                          <div></div>
                          <div></div>
                          <div></div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        {/* Change Task Selection */}
        {selectedPowerup === "changeTile" && selectedTile !== null && (
          <div className="relative z-20 mb-2">
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

        </div>

        {/* Action Buttons - Fixed at Bottom */}
        <div className="flex gap-3 pt-4 mt-4 border-t flex-shrink-0" style={{
          borderColor: isDark ? '#475569' : '#e2e8f0'
        }}>
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
