"use client";

import { useState, memo, useMemo } from "react";
import { GameState, Team, POWERUP_DEFS } from "@/types/game";
import { Button, Modal, inputClass } from "./ui";
import { diffTint } from "@/lib/gameUtils";

interface TeamsSidebarProps {
  game: GameState;
  isDark: boolean;
  myTeam: Team | null;
  isAdmin?: boolean;
  adminName?: string;
  onUsePowerup: () => void;
  onOpenClaimPowerup?: (teamId: string) => void;
  onAdminUsePowerup?: (teamId: string) => void;
  onEditTeam?: (teamId: string) => void;
  onClearCooldown?: (teamId: string) => void;
  onAdminToggleCooldown?: (teamId: string, currentValue: number) => void;
  dispatch: (event: any) => void;
  adminBombVisibility: boolean;
  isSpectator?: boolean;
}

function TeamsSidebar({
  game,
  isDark,
  myTeam,
  isAdmin = false,
  adminName,
  onUsePowerup,
  onOpenClaimPowerup,
  onAdminUsePowerup,
  onEditTeam,
  onClearCooldown,
  onAdminToggleCooldown,
  dispatch,
  adminBombVisibility,
  isSpectator = false,
}: TeamsSidebarProps) {
  const MAX_TILE = 56;
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [playerCompletions, setPlayerCompletions] = useState<{ [playerName: string]: number }>({});
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventoryTeamId, setInventoryTeamId] = useState<string | null>(null);

  // Memoize tile lookup to prevent flickering
  const raceTileMap = useMemo(() => {
    const map = new Map<number, string>();
    game.raceTiles.forEach((tile) => {
      map.set(tile.n, tile.label);
    });
    return map;
  }, [game.raceTiles]);

  // Memoize team data calculations
  const teamData = useMemo(() => {
    return game.teams?.map((team) => ({
      team,
      progress: Math.round((team.pos / MAX_TILE) * 100),
      currentTile: raceTileMap.get(team.pos) || `Tile ${team.pos}`,
    })) || [];
  }, [game.teams, raceTileMap]);

  const handleOpenPlayerModal = (teamId: string) => {
    setActiveTeamId(teamId);
    setPlayerCompletions({});
    setShowPlayerModal(true);
  };

  const incrementPlayer = (playerName: string, maxCompletions: number) => {
    const totalCompletions = Object.values(playerCompletions).reduce((sum, count) => sum + count, 0);
    if (totalCompletions >= maxCompletions) return;
    
    setPlayerCompletions(prev => ({
      ...prev,
      [playerName]: (prev[playerName] || 0) + 1,
    }));
  };

  const decrementPlayer = (playerName: string) => {
    setPlayerCompletions(prev => {
      const newCount = (prev[playerName] || 0) - 1;
      if (newCount <= 0) {
        const { [playerName]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [playerName]: newCount };
    });
  };

  const handleConfirmComplete = (minCompletions: number) => {
    if (!activeTeamId) return;
    
    // Convert playerCompletions object to array of player names (with duplicates for multiple completions)
    const playerNames: string[] = [];
    Object.entries(playerCompletions).forEach(([name, count]) => {
      for (let i = 0; i < count; i++) {
        playerNames.push(name);
      }
    });
    
    if (playerNames.length < minCompletions) {
      alert(`This tile requires at least ${minCompletions} completion${minCompletions > 1 ? 's' : ''}.`);
      return;
    }
    
    if (playerNames.length > 0) {
      dispatch({
        type: "COMPLETE_TILE",
        teamId: activeTeamId,
        playerNames,
        adminName: isAdmin ? (adminName || "Admin") : undefined,
      });
      setShowPlayerModal(false);
      setActiveTeamId(null);
      setPlayerCompletions({});
    }
  };

  const handleOpenInventory = (teamId: string) => {
    setInventoryTeamId(teamId);
    setShowInventoryModal(true);
  };

  const getPowerupName = (powerupId: string): string => {
    const powerup = POWERUP_DEFS.find(p => p.id === powerupId);
    return powerup ? powerup.name : powerupId;
  };

  return (
    <>
      <div className="space-y-3 md:space-y-4 max-w-full lg:max-w-[280px]">
      {teamData.map(({ team, progress, currentTile }) => {
        const isMyTeam = myTeam?.id === team.id;

        return (
          <div
            key={team.id}
            className={`
              ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}
              border rounded-xl md:rounded-2xl shadow-sm p-2 md:p-3
              ${isMyTeam ? "ring-2 ring-blue-500" : ""}
            `}
          >
            {/* Admin Edit Team Button at Top */}
            {isAdmin && (
              <Button
                variant="secondary"
                isDark={isDark}
                className="w-full text-xs py-1 md:py-1.5 mb-1.5 md:mb-2"
                onClick={() => onEditTeam && onEditTeam(team.id)}
              >
                ✏️ Edit Team
              </Button>
            )}

            {/* Team Header */}
            <div className="flex items-start justify-between mb-1.5">
              <div className="flex-1">
                <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                  {team.name}
                </h3>
                <div
                  className={`w-12 h-1 rounded-full mt-1 ${team.color}`}
                />
              </div>
              <div className={`px-2 py-1 rounded-lg text-sm font-medium ${team.color} text-white`}>
                #{team.pos}
              </div>
            </div>

            {/* Current Tile */}
            <p className={`text-sm mb-2 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              {currentTile}
            </p>

            {/* Team Members */}
            {team.members && team.members.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {team.members.map((member, idx) => (
                  <span
                    key={idx}
                    className={`
                      px-2 py-1 rounded-full text-xs
                      ${isDark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-700"}
                    `}
                  >
                    {member}
                  </span>
                ))}
              </div>
            )}

            {/* Progress Bar */}
            <div className="mb-1.5">
              <div className="flex justify-between text-xs mb-1">
                <span className={isDark ? "text-slate-400" : "text-slate-600"}>
                  Progress
                </span>
                <span className={isDark ? "text-slate-300" : "text-slate-700"}>
                  {progress}%
                </span>
              </div>
              <div className={`w-full h-2 rounded-full ${isDark ? "bg-slate-700" : "bg-slate-200"}`}>
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Powerup Count - Clickable */}
            {team.inventory && team.inventory.length > 0 && (() => {
              const isViewingOwnTeam = myTeam?.id === team.id;
              // Teams can always see their own timeBombs; admins can see others' bombs if visibility enabled
              const canSeeBombs = isViewingOwnTeam || (isAdmin && adminBombVisibility);
              const visibleInventory = canSeeBombs 
                ? team.inventory 
                : team.inventory.filter(powerupId => powerupId !== 'timeBomb');
              
              if (visibleInventory.length === 0) return null;
              
              return (
                <button
                  onClick={() => handleOpenInventory(team.id)}
                  className={`text-xs mb-2 hover:underline cursor-pointer transition-colors ${
                    isDark 
                      ? "text-slate-400 hover:text-slate-300" 
                      : "text-slate-600 hover:text-slate-700"
                  }`}
                >
                  ⚡ {visibleInventory.length} powerup{visibleInventory.length > 1 ? "s" : ""}
                </button>
              );
            })()}

            {/* Cooldown Status */}
            {team.powerupCooldown > 0 && (
              <p className={`text-xs mb-2 ${isDark ? "text-orange-400" : "text-orange-600"}`}>
                🔒 Powerup Cooldown: {team.powerupCooldown} tile{team.powerupCooldown !== 1 ? 's' : ''} remaining
              </p>
            )}

            {/* Admin Action Buttons */}
            {isAdmin && !isSpectator && (
              <div className="space-y-2 mb-3">
                <div className={`text-xs font-semibold mb-2 ${isDark ? "text-yellow-400" : "text-yellow-600"}`}>
                  👑 Admin Controls
                </div>
                
                <Button
                  variant="secondary"
                  isDark={isDark}
                  className="w-full text-xs py-2.5"
                  onClick={() => handleOpenPlayerModal(team.id)}
                >
                  ✅ Complete Tile
                </Button>
                
                {/* Claim Powerup and Use Powerup Buttons - side by side (same as team view) */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    isDark={isDark}
                    className="text-xs h-[52px] flex flex-col items-center justify-center pt-4"
                    onClick={() => onOpenClaimPowerup && onOpenClaimPowerup(team.id)}
                  >
                    <span>Claim Powerup</span>
                    <span>⚡</span>
                  </Button>
                  
                  {/* Use Powerup Button - with Clear overlay if cooldown active */}
                  <div className="relative">
                    <Button
                      variant={team.powerupCooldown > 0 ? "danger" : "secondary"}
                      isDark={isDark}
                      className={`w-full text-xs h-[52px] ${
                        team.powerupCooldown > 0 
                          ? team.inventory?.includes("clearCooldown")
                            ? "flex flex-col justify-start pt-1"
                            : "flex flex-col items-center justify-center"
                          : "flex flex-col items-center justify-center pt-4"
                      }`}
                      onClick={() => onAdminUsePowerup && onAdminUsePowerup(team.id)}
                      disabled={team.powerupCooldown > 0 || !team.inventory || team.inventory.length === 0}
                    >
                      {team.powerupCooldown > 0 ? (
                        <span>🔒 Cooldown ({team.powerupCooldown} tile{team.powerupCooldown !== 1 ? 's' : ''})</span>
                      ) : (
                        <>
                          <span>Use Powerup</span>
                          <span>⚡</span>
                        </>
                      )}
                    </Button>
                    {/* Cooldown indicator below button */}
                    {team.powerupCooldown === 0 && (
                      <div className={`text-center text-[10px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Cooldown: 0
                      </div>
                    )}
                    {team.powerupCooldown > 0 && team.inventory?.includes("clearCooldown") && (
                      <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center pb-2.5">
                        <button
                          onClick={() => {
                            if (window.confirm('Do you want to use powerup: Clear Cooldown?')) {
                              onClearCooldown && onClearCooldown(team.id);
                            }
                          }}
                          className={`text-[9px] py-0.5 px-2 rounded font-medium transition-all ${
                            isDark
                              ? "bg-emerald-700 hover:bg-emerald-600 text-white"
                              : "bg-emerald-600 hover:bg-emerald-500 text-white"
                          }`}
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Admin Cooldown Toggle - styled similar to team view */}
                <div className="relative">
                  <Button
                    variant={team.powerupCooldown > 0 ? "danger" : "secondary"}
                    isDark={isDark}
                    className="w-full text-xs h-[52px] flex flex-col items-center justify-center"
                    onClick={() => {
                      onAdminToggleCooldown && onAdminToggleCooldown(team.id, team.powerupCooldown);
                    }}
                  >
                    {team.powerupCooldown > 0 ? (
                      <>
                        <div className="font-semibold">🔒 Cooldown: {team.powerupCooldown}</div>
                        <div className="text-[10px] opacity-75 mt-0.5">👑 Click to change</div>
                      </>
                    ) : (
                      <>
                        <div>Set Cooldown</div>
                        <div className="text-[10px] opacity-75 mt-0.5">👑 Admin</div>
                      </>
                    )}
                  </Button>
                  {false && team.powerupCooldown > 0 && (
                    <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center pb-2.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className={`text-[9px] py-0.5 px-2 rounded font-medium transition-all ${
                          isDark
                            ? "bg-yellow-700 hover:bg-yellow-600 text-white"
                            : "bg-yellow-600 hover:bg-yellow-500 text-white"
                        }`}
                      >
                        👑 Admin Clear
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons (only for logged-in team) */}
            {isMyTeam && !isSpectator && (
              <div className="space-y-2">
                <Button
                  variant="primary"
                  isDark={isDark}
                  className="w-full py-2.5"
                  onClick={() => handleOpenPlayerModal(team.id)}
                >
                  Complete Tile
                </Button>
                
                {/* Claim Powerup and Use Powerup Buttons - side by side */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    isDark={isDark}
                    className="text-xs h-[52px] flex flex-col items-center justify-center pt-4"
                    onClick={() => onOpenClaimPowerup && onOpenClaimPowerup(team.id)}
                  >
                    <span>Claim Powerup</span>
                    <span>⚡</span>
                  </Button>
                  
                  {/* Use Powerup Button - with Clear overlay if cooldown active */}
                  <div className="relative">
                    <Button
                      variant={team.powerupCooldown > 0 ? "danger" : "secondary"}
                      isDark={isDark}
                      className={`w-full text-xs h-[52px] ${
                        team.powerupCooldown > 0 
                          ? team.inventory?.includes("clearCooldown")
                            ? "flex flex-col justify-start pt-1"
                            : "flex flex-col items-center justify-center"
                          : "flex flex-col items-center justify-center pt-4"
                      }`}
                      onClick={onUsePowerup}
                      disabled={team.powerupCooldown > 0 || !team.inventory || team.inventory.length === 0}
                    >
                      {team.powerupCooldown > 0 ? (
                        <span>🔒 Cooldown ({team.powerupCooldown} tile{team.powerupCooldown !== 1 ? 's' : ''})</span>
                      ) : (
                        <>
                          <span>Use Powerup</span>
                          <span>⚡</span>
                        </>
                      )}
                    </Button>
                    {/* Cooldown indicator below button */}
                    {team.powerupCooldown === 0 && (
                      <div className={`text-center text-[10px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Cooldown: 0
                      </div>
                    )}
                    {team.powerupCooldown > 0 && team.inventory?.includes("clearCooldown") && (
                      <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center pb-2.5">
                        <button
                          onClick={() => {
                            if (window.confirm('Do you want to use powerup: Clear Cooldown?')) {
                              onClearCooldown && onClearCooldown(team.id);
                            }
                          }}
                          className={`text-[9px] py-0.5 px-2 rounded font-medium transition-all ${
                            isDark
                              ? "bg-emerald-700 hover:bg-emerald-600 text-white"
                              : "bg-emerald-600 hover:bg-emerald-500 text-white"
                          }`}
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>

      {/* Player Selection Modal */}
      {showPlayerModal && activeTeamId && (() => {
        const activeTeam = game.teams.find(t => t.id === activeTeamId);
        if (!activeTeam) return null;
        
        const currentTile = game.raceTiles.find(t => t.n === activeTeam.pos);
        const maxCompletions = currentTile?.maxCompletions || 1;
        const minCompletions = currentTile?.minCompletions || 1;
        const allPlayers = [activeTeam.captain, ...(activeTeam.members || []).filter((m) => m !== activeTeam.captain)].filter(Boolean);
        const useCounters = minCompletions > 1 || maxCompletions > 1;
        const totalCompletions = Object.values(playerCompletions).reduce((sum, count) => sum + count, 0);
        
        return (
          <Modal isOpen={true} onClose={() => setShowPlayerModal(false)} isDark={isDark} maxWidth="max-w-sm" title="Who completed the tile?">
            <div className="space-y-3">
              {/* Tile Preview */}
              <div className={`rounded-xl border-2 p-3 ${diffTint(currentTile?.difficulty || 1, isDark)}`}>
                <div className="flex flex-col items-center">
                  {currentTile?.image && (
                    <img
                      src={currentTile.image}
                      alt=""
                      className="w-16 h-16 object-contain mb-2"
                    />
                  )}
                  <p className="text-center text-sm font-semibold">
                    {currentTile?.label || `Tile ${activeTeam.pos}`}
                  </p>
                  {currentTile?.instructions && (
                    <p className={`text-center text-xs mt-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {currentTile.instructions}
                    </p>
                  )}
                </div>
              </div>

              {allPlayers.length === 0 ? (
                <div className={`rounded-lg border p-3 text-xs ${isDark ? 'border-slate-700 bg-slate-900 text-slate-300' : 'border-slate-300 bg-slate-50 text-slate-600'}`}>
                  This team has no members set up. Please add team members first using the "Edit Team" button.
                </div>
              ) : !useCounters ? (
                <div className="space-y-2">
                  {allPlayers.map((playerName, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPlayerCompletions({ [playerName]: 1 })}
                      className={`
                        w-full px-3 py-2.5 rounded-lg border-2 transition-all relative
                        ${playerCompletions[playerName] === 1
                          ? isDark
                            ? 'border-blue-500 bg-blue-900/40 text-white'
                            : 'border-blue-500 bg-blue-50 text-slate-900'
                          : isDark
                            ? 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
                            : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                        }
                      `}
                    >
                      <span className="font-medium">{playerName}</span>
                      {playerCompletions[playerName] === 1 && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {allPlayers.map((playerName, idx) => {
                    const count = playerCompletions[playerName] || 0;
                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between gap-2 rounded-lg border px-2 py-1.5 ${
                          isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-slate-50'
                        }`}
                      >
                        <span className="text-sm">{playerName}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => decrementPlayer(playerName)}
                            disabled={count === 0}
                            className={`rounded text-sm font-bold w-8 h-8 flex items-center justify-center ${
                              count > 0
                                ? isDark
                                  ? 'text-white hover:bg-slate-700'
                                  : 'text-slate-900 hover:bg-slate-300'
                                : 'invisible'
                            }`}
                          >
                            <span className="text-xl leading-none">−</span>
                          </button>
                          <span className="text-sm font-semibold w-6 text-center">{count}</span>
                          <button
                            onClick={() => incrementPlayer(playerName, maxCompletions)}
                            disabled={totalCompletions >= maxCompletions}
                            className={`rounded text-sm font-bold w-8 h-8 flex items-center justify-center ${
                              totalCompletions < maxCompletions
                                ? isDark
                                  ? 'bg-slate-900 text-white hover:bg-slate-800'
                                  : 'bg-slate-800 text-white hover:bg-slate-700'
                                : 'invisible'
                            }`}
                          >
                            <span className="text-xl leading-none">+</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Total selections: {totalCompletions} (min: {minCompletions}, max: {maxCompletions})
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  isDark={isDark}
                  onClick={() => setShowPlayerModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  isDark={isDark}
                  onClick={() => handleConfirmComplete(minCompletions)}
                  disabled={totalCompletions === 0 || allPlayers.length === 0}
                  className="flex-1"
                >
                  Confirm {totalCompletions > 0 ? `(${totalCompletions})` : ''}
                </Button>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* Inventory Modal */}
      {showInventoryModal && inventoryTeamId && (() => {
        const team = game.teams.find(t => t.id === inventoryTeamId);
        if (!team) return null;

        const isViewingOwnTeam = myTeam?.id === inventoryTeamId;
        // Teams can always see their own timeBombs; admins can see others' bombs if visibility enabled
        const canSeeBombs = isViewingOwnTeam || (isAdmin && adminBombVisibility);
        const inventory = team.inventory || [];
        
        // Filter out time bombs if not authorized to see them
        const visibleInventory = canSeeBombs 
          ? inventory 
          : inventory.filter(powerupId => powerupId !== 'timeBomb');
        
        const powerupCounts: Record<string, number> = {};
        visibleInventory.forEach(powerupId => {
          powerupCounts[powerupId] = (powerupCounts[powerupId] || 0) + 1;
        });

        return (
          <Modal
            isOpen={showInventoryModal}
            onClose={() => setShowInventoryModal(false)}
            isDark={isDark}
            title={`${team.name}'s Inventory`}
          >
            <div className="space-y-4">
              {inventory.length === 0 ? (
                <div className={`text-center py-8 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  No powerups in inventory
                </div>
              ) : visibleInventory.length === 0 ? (
                <div className={`text-center py-8 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  No visible powerups
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(powerupCounts).map(([powerupId, count]) => {
                    // Check if this powerup is insured
                    const firstIndex = inventory.indexOf(powerupId);
                    const isInsured = (team?.insuredPowerups || []).includes(firstIndex);
                    
                    return (
                      <div
                        key={powerupId}
                        className={`p-3 rounded-lg border ${
                          isDark 
                            ? 'bg-slate-800 border-slate-700' 
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {getPowerupName(powerupId)} {isInsured && '🛡️'}
                            </div>
                            <div className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                              {POWERUP_DEFS.find(p => p.id === powerupId)?.description || ''}
                              {isInsured && (
                                <span className={`ml-2 font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                  (Insured)
                                </span>
                              )}
                            </div>
                          </div>
                          {count > 1 && (
                            <div className={`ml-3 px-2 py-1 rounded-full text-sm font-semibold ${
                              isDark 
                                ? 'bg-blue-900 text-blue-200' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              ×{count}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <Button
                variant="secondary"
                isDark={isDark}
                onClick={() => setShowInventoryModal(false)}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </Modal>
        );
      })()}
    </>
  );
}

export default memo(TeamsSidebar, (prevProps, nextProps) => {
  // Only re-render if relevant data changes
  return (
    prevProps.isDark === nextProps.isDark &&
    prevProps.myTeam?.id === nextProps.myTeam?.id &&
    prevProps.isAdmin === nextProps.isAdmin &&
    prevProps.adminBombVisibility === nextProps.adminBombVisibility &&
    JSON.stringify(prevProps.game.teams?.map(t => ({ 
      id: t.id, 
      name: t.name, 
      pos: t.pos, 
      inventory: t.inventory,
      powerupCooldown: t.powerupCooldown
    }))) === 
    JSON.stringify(nextProps.game.teams?.map(t => ({ 
      id: t.id, 
      name: t.name, 
      pos: t.pos, 
      inventory: t.inventory,
      powerupCooldown: t.powerupCooldown
    })))
  );
});
