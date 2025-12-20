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
import { PoolTask } from "@/types/game";

export default function TileRaceGame() {
  const { game, loading, dispatch } = useGameSync();
  const [isDark] = useState(true);
  const { myTeam, setTeam, logout, isRestoring } = useTeamSession(game.teams || []);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [winningTeam, setWinningTeam] = useState<Team | null>(null);
  const [showUsePowerupModal, setShowUsePowerupModal] = useState(false);
  const [usePowerupTeamId, setUsePowerupTeamId] = useState<string | null>(null);
  const [showAdminOptions, setShowAdminOptions] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
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
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editingPowerupTile, setEditingPowerupTile] = useState<PowerupTile | null>(null);
  const [editingPoolTask, setEditingPoolTask] = useState<PoolTask | null>(null);
  
  // Claim powerup modal states
  const [claimTeamId, setClaimTeamId] = useState<string | null>(null);
  const [claimSelectedPowerupTileId, setClaimSelectedPowerupTileId] = useState<number | null>(null);
  const [claimConfirmOpen, setClaimConfirmOpen] = useState(false);
  const [powerupClaimPickerOpen, setPowerupClaimPickerOpen] = useState(false);

  const handlers = useGameHandlers({
    dispatch,
    setTeam,
    logout,
    setShowFormTeamsModal,
    setShowImportTasksModal,
    setShowImportPowerupsModal,
    setShowGradientSettingsModal,
    setShowAdminOptions,
    setIsAdmin,
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
      await dispatch({
        type: "USE_POWERUP",
        teamId,
        powerupId,
        ...data,
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

  const handleEditTeam = (teamId: string) => {
    const team = game.teams.find((t) => t.id === teamId);
    if (team) {
      setEditingTeam(team);
    }
  };

  const handleUpdateTeam = async (teamId: string, updates: Partial<Team>) => {
    try {
      await dispatch({
        type: "ADMIN_UPDATE_TEAM",
        teamId,
        updates,
      });
      setEditingTeam(null);
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
        >
          <AdminOptionsDropdown
            isDark={isDark}
            onClose={() => setShowAdminOptions(false)}
            onRandomizeTiles={handlers.handleRandomizeTiles}
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

        {!myTeam && !isAdmin ? (
          <TeamSelect 
            game={game} 
            isDark={isDark} 
            onSelectTeam={handlers.handleSelectTeam}
            onAdminLogin={(password) => {
              if (password === "admin123") {
                setIsAdmin(true);
              } else {
                alert("Incorrect admin password!");
              }
            }}
          />
        ) : !myTeam && isAdmin ? (
          <MainGameLayout
            game={game}
            isDark={isDark}
            myTeam={null}
            isAdmin={isAdmin}
            onCompleteTile={handlers.handleCompleteTile}
            onUsePowerup={handleOpenUsePowerup}
            onClaimPowerup={handleClaimPowerupFromBoard}
            onOpenClaimPowerup={handleOpenClaimPowerup}
            onAdminUsePowerup={handleAdminUsePowerup}
            onEditTeam={handleEditTeam}
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
            onCompleteTile={handlers.handleCompleteTile}
            onUsePowerup={handleOpenUsePowerup}
            onClaimPowerup={handleClaimPowerupFromBoard}
            onOpenClaimPowerup={handleOpenClaimPowerup}
            onAdminUsePowerup={handleAdminUsePowerup}
            onEditTeam={handleEditTeam}
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
          onLogin={(password) => {
            if (password === "admin123") {
              setIsAdmin(true);
              setShowAdminLogin(false);
            } else {
              alert("Incorrect admin password!");
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
            onUndo={() => {
              handlers.handleUndo();
              setShowUndoHistoryModal(false);
            }}
          />
        )}

        {/* Edit Team Modal */}
        {editingTeam && (
          <EditTeamModal
            isOpen={true}
            isDark={isDark}
            team={editingTeam}
            onClose={() => setEditingTeam(null)}
            onUpdateTeam={handleUpdateTeam}
          />
        )}

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
      </div>
    </div>
  );
}
