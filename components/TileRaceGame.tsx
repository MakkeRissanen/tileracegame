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

export default function TileRaceGame() {
  const { game, loading, dispatch } = useGameSync();
  const [isDark] = useState(true);
  const { myTeam, setTeam, logout, isRestoring } = useTeamSession(game.teams || []);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [winningTeam, setWinningTeam] = useState<Team | null>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedPowerupTile, setSelectedPowerupTile] = useState<PowerupTile | null>(null);
  const [showUsePowerupModal, setShowUsePowerupModal] = useState(false);
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

  const handleClaimPowerup = (tileId: number) => {
    const tile = game.powerupTiles?.find((pt) => pt.id === tileId);
    if (tile && myTeam) {
      setSelectedPowerupTile(tile);
      setShowClaimModal(true);
    }
  };

  const handleClaimPowerupSubmit = async (tileId: number, playerNames: string[]) => {
    if (!myTeam) return;
    try {
      await dispatch({
        type: "CLAIM_POWERUP_TILE",
        teamId: myTeam.id,
        powerTileId: tileId,
        playerNames,
      });
    } catch (err) {
      alert(`Failed to claim powerup: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleUsePowerup = async (powerupId: string, data: any) => {
    if (!myTeam) return;
    try {
      await dispatch({
        type: "USE_POWERUP",
        teamId: myTeam.id,
        powerupId,
        ...data,
      });
    } catch (err) {
      alert(`Failed to use powerup: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleAdminUsePowerup = (teamId: string) => {
    const team = game.teams.find((t) => t.id === teamId);
    if (team) {
      // Set the team temporarily to open the powerup modal
      setSelectedPowerupTile(null);
      setShowUsePowerupModal(true);
      // Store the team ID for admin use
      (window as any).__adminTeamId = teamId;
    }
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
    <div className={`min-h-screen ${isDark ? "bg-slate-900" : "bg-slate-50"} p-4 md:p-6`}>
      <div className="max-w-[1600px] mx-auto">
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
            onUsePowerup={() => setShowUsePowerupModal(true)}
            onClaimPowerup={handleClaimPowerup}
            onAdminUsePowerup={handleAdminUsePowerup}
            onEditTeam={handleEditTeam}
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
            onUsePowerup={() => setShowUsePowerupModal(true)}
            onClaimPowerup={handleClaimPowerup}
            onAdminUsePowerup={handleAdminUsePowerup}
            onEditTeam={handleEditTeam}
            onClearPools={async () => {
              if (!confirm("Clear all task pools?")) return;
              await dispatch({ type: "ADMIN_CLEAR_TASK_POOLS" });
            }}
          />
        )}

        {/* Claim Powerup Modal */}
        {myTeam && selectedPowerupTile && (
          <ClaimPowerupModal
            isOpen={showClaimModal}
            onClose={() => {
              setShowClaimModal(false);
              setSelectedPowerupTile(null);
            }}
            tile={selectedPowerupTile}
            team={myTeam}
            game={game}
            isDark={isDark}
            onClaim={handleClaimPowerupSubmit}
          />
        )}

        {/* Use Powerup Modal */}
        {myTeam && (
          <UsePowerupModal
            isOpen={showUsePowerupModal}
            onClose={() => setShowUsePowerupModal(false)}
            team={myTeam}
            game={game}
            isDark={isDark}
            onUsePowerup={handleUsePowerup}
          />
        )}

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
      </div>
    </div>
  );
}
