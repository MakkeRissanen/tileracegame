"use client";

import { useState, useEffect } from "react";
import { useGameSync } from "@/hooks/useGameSync";
import { useTeamSession } from "@/hooks/useTeamSession";
import { useGameHandlers } from "@/hooks/useGameHandlers";
import { GameState, Team, PowerupTile } from "@/types/game";
import ClaimPowerupModal from "./ClaimPowerupModal";
import UsePowerupModal from "./UsePowerupModal";
import TaskPoolsSection from "./TaskPoolsSection";
import GameHeader from "./GameHeader";
import AdminOptionsDropdown from "./AdminOptionsDropdown";
import AdminLoginModal from "./AdminLoginModal";
import VictoryModal from "./VictoryModal";
import TeamSelect from "./TeamSelect";
import MainGameLayout from "./MainGameLayout";
import FormTeamsModal from "./FormTeamsModal";
import ImportTasksModal from "./ImportTasksModal";
import ImportPowerupsModal from "./ImportPowerupsModal";
import GradientSettingsModal from "./GradientSettingsModal";
import FogOfWarModal from "./FogOfWarModal";
import ManageAdminsModal from "./ManageAdminsModal";
import ChangePasswordModal from "./ChangePasswordModal";
import SetTeamPasswordsModal from "./SetTeamPasswordsModal";
import UndoHistoryModal from "./UndoHistoryModal";
import EditTeamModal from "./EditTeamModal";
import EditPowerupTileModal from "./EditPowerupTileModal";
import EditPoolTaskModal from "./EditPoolTaskModal";
import ClaimPowerupConfirmModal from "./ClaimPowerupConfirmModal";
import PowerupClaimPlayerPickerModal from "./PowerupClaimPlayerPickerModal";
import RulebookModal from "./RulebookModal";
import { PoolTask } from "@/types/game";
import { verifyTeamCredentials, verifyAdminCredentials } from "@/lib/teamAuth";

export default function TileRaceGame() {
  // Authentication state - controls when game data is loaded
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authInProgress, setAuthInProgress] = useState(false);
  
  // Only sync game state after authentication
  const { game, loading, dispatch } = useGameSync("main", isAuthenticated);
  const [isDark] = useState(true);
  const { myTeam, setTeam, logout, isRestoring } = useTeamSession(game.teams || []);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [winningTeam, setWinningTeam] = useState<Team | null>(null);
  const [showUsePowerupModal, setShowUsePowerupModal] = useState(false);
  const [usePowerupTeamId, setUsePowerupTeamId] = useState<string | null>(null);
  const [showAdminOptions, setShowAdminOptions] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);
  const [adminName, setAdminName] = useState<string | null>(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showFormTeamsModal, setShowFormTeamsModal] = useState(false);
  const [showImportTasksModal, setShowImportTasksModal] = useState(false);
  const [showImportPowerupsModal, setShowImportPowerupsModal] = useState(false);
  const [showGradientSettingsModal, setShowGradientSettingsModal] = useState(false);
  const [showFogOfWarModal, setShowFogOfWarModal] = useState(false);
  const [showManageAdminsModal, setShowManageAdminsModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showSetTeamPasswordsModal, setShowSetTeamPasswordsModal] = useState(false);
  const [showUndoHistoryModal, setShowUndoHistoryModal] = useState(false);
  const [showRulebookModal, setShowRulebookModal] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingPowerupTile, setEditingPowerupTile] = useState<PowerupTile | null>(null);
  const [editingPoolTask, setEditingPoolTask] = useState<PoolTask | null>(null);
  
  // Claim powerup modal states
  const [claimTeamId, setClaimTeamId] = useState<string | null>(null);
  const [claimSelectedPowerupTileId, setClaimSelectedPowerupTileId] = useState<number | null>(null);
  const [claimConfirmOpen, setClaimConfirmOpen] = useState(false);
  const [powerupClaimPickerOpen, setPowerupClaimPickerOpen] = useState(false);

  // Handle team login with authentication
  const handleTeamLogin = async (team: Team, password: string) => {
    setAuthInProgress(true);
    try {
      const result = await verifyTeamCredentials("main", team.name, password);
      
      if (result.success) {
        setIsAuthenticated(true);
        // Wait a moment for game state to load before setting team
        setTimeout(() => {
          setTeam(result.team);
          setAuthInProgress(false);
        }, 500);
      } else {
        alert(result.error);
        setAuthInProgress(false);
      }
    } catch (err) {
      alert("Authentication failed. Please try again.");
      setAuthInProgress(false);
    }
  };

  // Handle admin login
  const handleAdminLogin = async (adminName: string, password: string) => {
    setAuthInProgress(true);
    try {
      const result = await verifyAdminCredentials("main", adminName, password);
      
      if (result.success) {
        // Use the admin name from the database
        setAdminName(result.admin.name);
        setIsMasterAdmin(result.admin.isMaster || false);
        setIsAuthenticated(true);
        setIsAdmin(true);
        setAuthInProgress(false);
      } else {
        alert(result.error || "Invalid admin credentials");
        setAuthInProgress(false);
      }
    } catch (err) {
      alert("Authentication failed. Please try again.");
      setAuthInProgress(false);
    }
  };

  // Handle logout - clear authentication
  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
    setIsAdmin(false);
    setIsMasterAdmin(false);
    setAdminName(null);
  };

  const handlers = useGameHandlers({
    dispatch,
    setTeam,
    logout: handleLogout,
    setShowFormTeamsModal,
    setShowImportTasksModal,
    setShowImportPowerupsModal,
    setShowGradientSettingsModal,
    setShowAdminOptions,
    setIsAdmin,
    game,
    adminName,
  });

  // Check for victory
  useEffect(() => {
    const winner = game.teams?.find((t) => t.pos >= 56);
    if (winner && !showVictoryModal) {
      setWinningTeam(winner);
      setShowVictoryModal(true);
    }
  }, [game.teams, showVictoryModal]);

  // Alert when fog of war is disabled due to errors
  useEffect(() => {
    if (game.fogOfWarDisabled === "all" && game.log && game.log.length > 0) {
      const lastLog = game.log[game.log.length - 1];
      if (lastLog.message.includes("⚠️ ERROR")) {
        alert(lastLog.message);
      }
    }
  }, [game.fogOfWarDisabled, game.log]);

  // Wrapper for PowerupTilesBoard - it expects a (tileId: number) => void but we'll just open the modal for myTeam
  const handleClaimPowerupFromBoard = (tileId: number) => {
    if (myTeam) {
      handleOpenClaimPowerup(myTeam.id);
    }
  };

  const handleUsePowerup = async (powerupId: string, data: any) => {
    const teamId = usePowerupTeamId || myTeam?.id;
    if (!teamId) return;
    
    try {
      // Check if this is an admin action (admin controlling a team, even if it's their own)
      const isAdminAction = isAdmin && usePowerupTeamId !== null;
      
      // For changeTile powerup, capture old and new task labels
      let eventData = { ...data };
      if (powerupId === 'changeTile' && data.futureTile !== undefined && data.changeTaskId) {
        const targetTile = game.raceTiles.find(t => t.n === Number(data.futureTile));
        if (targetTile) {
          eventData.oldTaskLabel = targetTile.label;
          
          // Find the new task label
          const allTasks = [
            ...(game.taskPools?.easy || []),
            ...(game.taskPools?.medium || []),
            ...(game.taskPools?.hard || [])
          ];
          const newTask = allTasks.find(t => t.id === data.changeTaskId);
          if (newTask) {
            eventData.newTaskLabel = newTask.label;
          }
        }
      }
      
      // For copypaste, capture old and new task labels
      if (powerupId === 'copypaste' && data.futureTile !== undefined) {
        const team = game.teams.find(t => t.id === teamId);
        if (team) {
          const sourceTile = game.raceTiles.find(t => t.n === team.pos);
          const targetTile = game.raceTiles.find(t => t.n === Number(data.futureTile));
          if (sourceTile && targetTile) {
            eventData.oldTaskLabel = targetTile.label;
            eventData.newTaskLabel = sourceTile.label;
          }
        }
      }
      
      // For skip powerups, capture from and to tile positions
      if (powerupId === 'skip1' || powerupId === 'skip2' || powerupId === 'skip3') {
        const team = game.teams.find(t => t.id === teamId);
        if (team) {
          eventData.fromTileNumber = team.pos;
          const steps = powerupId === 'skip1' ? 1 : powerupId === 'skip2' ? 2 : 3;
          // Calculate destination (same logic as usePowerupHandler)
          let dest = team.pos;
          for (let i = 0; i < steps; i++) {
            const preCleared = team.preCleared || [];
            if (preCleared.includes(dest + 1)) {
              dest += 2;
            } else {
              dest += 1;
            }
          }
          eventData.toTileNumber = dest;
        }
      }
      
      // For back powerups, capture from and to tile positions of target team
      if (powerupId === 'back1' || powerupId === 'back2' || powerupId === 'back3') {
        if (data.targetId) {
          const targetTeam = game.teams.find(t => t.id === data.targetId);
          if (targetTeam) {
            const steps = powerupId === 'back1' ? 1 : powerupId === 'back2' ? 2 : 3;
            eventData.fromTileNumber = targetTeam.pos;
            eventData.toTileNumber = Math.max(1, targetTeam.pos - steps);
          }
        }
      }
      
      await dispatch({
        type: "USE_POWERUP",
        teamId,
        powerupId,
        ...eventData,
        ...(isAdminAction && { adminName: adminName || "Admin" }),
      });
      // Reset state after successful use
      setUsePowerupTeamId(null);
    } catch (err) {
      alert(`Failed to use powerup: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleAdminUsePowerup = (teamId: string) => {
    const team = game.teams.find((t) => t.id === teamId);
    if (team) {
      setUsePowerupTeamId(teamId);
      setShowUsePowerupModal(true);
    }
  };

  const handleOpenUsePowerup = () => {
    if (myTeam) {
      setUsePowerupTeamId(myTeam.id);
      setShowUsePowerupModal(true);
    }
  };

  const handleCloseUsePowerup = () => {
    setShowUsePowerupModal(false);
    setUsePowerupTeamId(null);
  };

  const handleClearCooldown = async (teamId: string) => {
    try {
      await dispatch({
        type: "USE_POWERUP",
        teamId,
        powerupId: "clearCooldown",
      });
    } catch (err) {
      alert(`Failed to clear cooldown: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleAdminToggleCooldown = async (teamId: string) => {
    try {
      await dispatch({
        type: "ADMIN_TOGGLE_COOLDOWN",
        teamId,
        adminName: adminName || undefined,
      });
    } catch (err) {
      alert(`Failed to toggle cooldown: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleEditTeam = (teamId: string) => {
    setEditingTeamId(teamId);
  };

  const handleUpdateTeam = async (teamId: string, updates: Partial<Team>) => {
    try {
      // Calculate changes for Discord formatting
      const oldTeam = game.teams.find((t) => t.id === teamId);
      const changes: string[] = [];
      
      if (oldTeam) {
        for (const [key, newValue] of Object.entries(updates)) {
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
            } else if (key === "discordWebhookSlot") {
              const oldSlot = oldValue === null || oldValue === undefined ? "None" : `Channel ${oldValue}`;
              const newSlot = newValue === null || newValue === undefined ? "None" : `Channel ${newValue}`;
              changes.push(`discord: ${oldSlot} → ${newSlot}`);
            } else if (key === "members") {
              const oldMembers = Array.isArray(oldValue) ? oldValue : [];
              const newMembers = Array.isArray(newValue) ? newValue : [];
              changes.push(`members: [${oldMembers.join(", ")}] → [${newMembers.join(", ")}]`);
            } else {
              changes.push(`${key}: ${JSON.stringify(oldValue)} → ${JSON.stringify(newValue)}`);
            }
          }
        }
      }
      
      await dispatch({
        type: "ADMIN_UPDATE_TEAM",
        teamId,
        updates,
        adminName: adminName || undefined,
        changes,
      });
      setEditingTeamId(null);
    } catch (err) {
      alert(`Failed to update team: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleEditPowerupTile = (tileId: number) => {
    const tile = game.powerupTiles?.find((t) => t.id === tileId);
    if (tile) {
      setEditingPowerupTile(tile);
    }
  };

  const handleUpdatePowerupTile = async (tileId: number, updates: Partial<PowerupTile>, teamClaims?: { teamId: string; claimed: boolean }[]) => {
    try {
      await dispatch({
        type: "ADMIN_UPDATE_POWERUP_TILE",
        tileId,
        updates,
        teamClaims,
      });
      setEditingPowerupTile(null);
    } catch (err) {
      alert(`Failed to update powerup tile: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleEditPoolTask = (taskId: string) => {
    // Find task in any of the task pools
    let foundTask: PoolTask | undefined;
    for (const difficulty of [1, 2, 3]) {
      const tasks = game.taskPools?.[difficulty] || [];
      foundTask = tasks.find((t) => t.id === taskId);
      if (foundTask) break;
    }
    if (foundTask) {
      setEditingPoolTask(foundTask);
    }
  };

  const handleUpdatePoolTask = async (taskId: string, updates: Partial<PoolTask>) => {
    try {
      await dispatch({
        type: "ADMIN_UPDATE_POOL_TASK",
        taskId,
        updates,
      });
      setEditingPoolTask(null);
    } catch (err) {
      alert(`Failed to update pool task: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  // Claim powerup handlers
  const handleOpenClaimPowerup = (teamId: string) => {
    // Check if any team has reached tile 5 or higher
    const hasTeamReachedTile5 = game.teams.some(team => team.pos >= 5);
    
    if (!hasTeamReachedTile5) {
      alert("Powerup tiles are not available yet. At least one team must complete tile 4 (reach tile 5) before powerups can be claimed.");
      return;
    }
    
    setClaimTeamId(teamId);
    setClaimSelectedPowerupTileId(null);
    setClaimConfirmOpen(false);
    setPowerupClaimPickerOpen(false);
  };

  const handleSelectPowerupTile = (tileId: number) => {
    setClaimSelectedPowerupTileId(tileId);
    setClaimConfirmOpen(true);
  };

  const handleConfirmPowerupClaim = () => {
    setClaimConfirmOpen(false);
    setPowerupClaimPickerOpen(true);
  };

  const handleClaimPowerupWithPlayers = async (playerNames: string[]) => {
    if (!claimTeamId || claimSelectedPowerupTileId === null) return;

    try {
      await dispatch({
        type: "CLAIM_POWERUP_TILE",
        teamId: claimTeamId,
        powerTileId: claimSelectedPowerupTileId,
        playerNames,
        ...(adminName && { adminName: adminName }),
      });
      
      // Close all modals
      setClaimTeamId(null);
      setClaimSelectedPowerupTileId(null);
      setClaimConfirmOpen(false);
      setPowerupClaimPickerOpen(false);
    } catch (err) {
      alert(`Failed to claim powerup: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleCloseClaimModals = () => {
    setClaimTeamId(null);
    setClaimSelectedPowerupTileId(null);
    setClaimConfirmOpen(false);
    setPowerupClaimPickerOpen(false);
  };

  if (loading || isRestoring) {
    return (
      <div className={`min-h-screen ${isDark ? "bg-slate-900" : "bg-slate-50"} p-8`}>
        <div className="text-center">
          <div className={`text-xl ${isDark ? "text-white" : "text-slate-900"}`}>
            Loading game...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? "bg-slate-900" : "bg-slate-50"} p-2`}>
      <div className="max-w-full mx-auto">
        <GameHeader
          isDark={isDark}
          myTeam={myTeam}
          isAdmin={isAdmin}
          showAdminOptions={showAdminOptions}
          onShowAdminLogin={() => setShowAdminLogin(true)}
          onToggleAdminOptions={() => setShowAdminOptions(!showAdminOptions)}
          onAdminLogout={() => {
            setIsAdmin(false);
            setShowAdminOptions(false);
          }}
          onLogout={handlers.handleLogout}
          onShowRulebook={() => setShowRulebookModal(true)}
        >
          <AdminOptionsDropdown
            isDark={isDark}
            isMasterAdmin={isMasterAdmin}
            onClose={() => setShowAdminOptions(false)}
            onFormTeams={() => setShowFormTeamsModal(true)}
            onImportTasks={() => setShowImportTasksModal(true)}
            onImportPowerups={() => setShowImportPowerupsModal(true)}
            onGradientSettings={() => setShowGradientSettingsModal(true)}
            onDisableFogOfWar={() => setShowFogOfWarModal(true)}
            fogOfWarMode={game.fogOfWarDisabled || "none"}
            onResetAll={handlers.handleResetAll}
            onManageAdmins={() => setShowManageAdminsModal(true)}
            onChangePassword={() => setShowChangePasswordModal(true)}
            onSetTeamPasswords={() => setShowSetTeamPasswordsModal(true)}
            onUndo={() => { setShowAdminOptions(false); setShowUndoHistoryModal(true); }}
          />
        </GameHeader>

        {!isAuthenticated ? (
          <TeamSelect 
            isDark={isDark} 
            onSelectTeam={handleTeamLogin}
            onAdminLogin={handleAdminLogin}
            isLoading={authInProgress || loading}
          />
        ) : !myTeam && isAdmin ? (
          <MainGameLayout
            game={game}
            isDark={isDark}
            myTeam={null}
            isAdmin={isAdmin}
            adminName={adminName || undefined}
            onCompleteTile={handlers.handleCompleteTile}
            onUsePowerup={handleOpenUsePowerup}
            onClaimPowerup={handleClaimPowerupFromBoard}
            onOpenClaimPowerup={handleOpenClaimPowerup}
            onAdminUsePowerup={handleAdminUsePowerup}
            onEditTeam={handleEditTeam}
            onClearCooldown={handleClearCooldown}
            onAdminToggleCooldown={handleAdminToggleCooldown}
            onEditPowerupTile={handleEditPowerupTile}
            onEditPoolTask={handleEditPoolTask}
            onClearPools={async () => {
              if (!confirm("Clear all task pools?")) return;
              await dispatch({ type: "ADMIN_CLEAR_TASK_POOLS" });
            }}
          />
        ) : (
          <MainGameLayout
            game={game}
            isDark={isDark}
            myTeam={myTeam}
            isAdmin={isAdmin}
            adminName={adminName || undefined}
            onCompleteTile={handlers.handleCompleteTile}
            onUsePowerup={handleOpenUsePowerup}
            onClaimPowerup={handleClaimPowerupFromBoard}
            onOpenClaimPowerup={handleOpenClaimPowerup}
            onAdminUsePowerup={handleAdminUsePowerup}
            onEditTeam={handleEditTeam}
            onClearCooldown={handleClearCooldown}
            onAdminToggleCooldown={handleAdminToggleCooldown}
            onEditPowerupTile={handleEditPowerupTile}
            onEditPoolTask={handleEditPoolTask}
            onClearPools={async () => {
              if (!confirm("Clear all task pools?")) return;
              await dispatch({ type: "ADMIN_CLEAR_TASK_POOLS" });
            }}
          />
        )}

        {/* Use Powerup Modal */}
        {(() => {
          const teamForPowerup = usePowerupTeamId 
            ? game.teams.find(t => t.id === usePowerupTeamId)
            : myTeam;
          
          if (!teamForPowerup) return null;
          
          return (
            <UsePowerupModal
              isOpen={showUsePowerupModal}
              onClose={handleCloseUsePowerup}
              team={teamForPowerup}
              game={game}
              isDark={isDark}
              onUsePowerup={handleUsePowerup}
            />
          );
        })()}

        {/* Admin Login Modal */}
        <AdminLoginModal
          isOpen={showAdminLogin}
          isDark={isDark}
          onClose={() => setShowAdminLogin(false)}
          onLogin={async (password) => {
            try {
              const response = await fetch('/api/admin/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
              });
              const data = await response.json();
              if (data.success) {
                setIsAdmin(true);
                setShowAdminLogin(false);
              } else {
                alert("Incorrect admin password!");
              }
            } catch (error) {
              alert("Error verifying password. Please try again.");
            }
          }}
        />

        {/* Victory Modal */}
        {winningTeam && (
          <VictoryModal
            isOpen={showVictoryModal}
            isDark={isDark}
            winningTeam={winningTeam}
            onClose={() => setShowVictoryModal(false)}
          />
        )}

        {/* Form Teams Modal */}
        <FormTeamsModal
          isOpen={showFormTeamsModal}
          isDark={isDark}
          onClose={() => setShowFormTeamsModal(false)}
          onApply={handlers.handleFormTeamsApply}
        />

        {/* Import Tasks Modal */}
        <ImportTasksModal
          isOpen={showImportTasksModal}
          isDark={isDark}
          onClose={() => setShowImportTasksModal(false)}
          onImport={handlers.handleImportTasks}
        />

        {/* Import Powerups Modal */}
        <ImportPowerupsModal
          isOpen={showImportPowerupsModal}
          isDark={isDark}
          onClose={() => setShowImportPowerupsModal(false)}
          onImport={handlers.handleImportPowerups}
        />

        {/* Gradient Settings Modal */}
        <GradientSettingsModal
          isOpen={showGradientSettingsModal}
          isDark={isDark}
          onClose={() => setShowGradientSettingsModal(false)}
          onSave={handlers.handleSaveGradientSettings}
          onApply={handlers.handleGradientSettings}
        />

        {/* Fog of War Modal */}
        {showFogOfWarModal && (
          <FogOfWarModal
            isDark={isDark}
            currentMode={game.fogOfWarDisabled || "none"}
            onClose={() => setShowFogOfWarModal(false)}
            onSetMode={handlers.handleDisableFogOfWar}
          />
        )}

        {/* Manage Admins Modal */}
        {showManageAdminsModal && (
          <ManageAdminsModal
            isOpen={showManageAdminsModal}
            isDark={isDark}
            admins={game.admins || []}
            onClose={() => setShowManageAdminsModal(false)}
            onAddAdmin={handlers.handleAddAdmin}
            onRemoveAdmin={handlers.handleRemoveAdmin}
          />
        )}

        {/* Change Password Modal */}
        {showChangePasswordModal && (
          <ChangePasswordModal
            isOpen={showChangePasswordModal}
            isDark={isDark}
            onClose={() => setShowChangePasswordModal(false)}
            onChangePassword={handlers.handleChangePassword}
          />
        )}

        {/* Set Team Passwords Modal */}
        {showSetTeamPasswordsModal && (
          <SetTeamPasswordsModal
            isOpen={showSetTeamPasswordsModal}
            isDark={isDark}
            teams={game.teams}
            onClose={() => setShowSetTeamPasswordsModal(false)}
            onSetAllPasswords={handlers.handleSetAllTeamPasswords}
            onSetTeamPassword={handlers.handleSetTeamPassword}
          />
        )}

        {/* Undo History Modal */}
        {showUndoHistoryModal && (
          <UndoHistoryModal
            isOpen={showUndoHistoryModal}
            isDark={isDark}
            currentState={game}
            onClose={() => setShowUndoHistoryModal(false)}
            onUndo={(targetIndex) => {
              handlers.handleUndo(adminName || undefined, targetIndex);
              setShowUndoHistoryModal(false);
            }}
          />
        )}

        {/* Edit Team Modal */}
        {editingTeamId && (() => {
          const team = game.teams.find((t) => t.id === editingTeamId);
          return team ? (
            <EditTeamModal
              isOpen={true}
              isDark={isDark}
              team={team}
              game={game}
              isMasterAdmin={isMasterAdmin}
              onClose={() => setEditingTeamId(null)}
              onUpdateTeam={handleUpdateTeam}
            />
          ) : null;
        })()}

        {/* Edit Powerup Tile Modal */}
        {editingPowerupTile && (
          <EditPowerupTileModal
            isOpen={true}
            isDark={isDark}
            tile={editingPowerupTile}
            game={game}
            onClose={() => setEditingPowerupTile(null)}
            onUpdate={handleUpdatePowerupTile}
          />
        )}

        {/* Edit Pool Task Modal */}
        {editingPoolTask && (
          <EditPoolTaskModal
            isOpen={true}
            isDark={isDark}
            task={editingPoolTask}
            onClose={() => setEditingPoolTask(null)}
            onUpdate={handleUpdatePoolTask}
          />
        )}

        {/* Claim Powerup Modals */}
        {claimTeamId && !claimConfirmOpen && !powerupClaimPickerOpen && (
          <ClaimPowerupModal
            isOpen={true}
            team={game.teams.find((t) => t.id === claimTeamId)!}
            game={game}
            onClose={handleCloseClaimModals}
            onSelectTile={handleSelectPowerupTile}
          />
        )}

        {claimTeamId && claimSelectedPowerupTileId !== null && claimConfirmOpen && (
          <ClaimPowerupConfirmModal
            isOpen={true}
            tile={game.powerupTiles?.find((pt) => pt.id === claimSelectedPowerupTileId) || null}
            team={game.teams.find((t) => t.id === claimTeamId)!}
            onClose={handleCloseClaimModals}
            onConfirm={handleConfirmPowerupClaim}
          />
        )}

        {claimTeamId && claimSelectedPowerupTileId !== null && powerupClaimPickerOpen && (
          <PowerupClaimPlayerPickerModal
            isOpen={true}
            tile={game.powerupTiles?.find((pt) => pt.id === claimSelectedPowerupTileId) || null}
            team={game.teams.find((t) => t.id === claimTeamId)!}
            onClose={handleCloseClaimModals}
            onConfirm={handleClaimPowerupWithPlayers}
          />
        )}

        {/* Rulebook Modal */}
        <RulebookModal
          isOpen={showRulebookModal}
          onClose={() => setShowRulebookModal(false)}
          isDark={isDark}
        />
      </div>
    </div>
  );
}
