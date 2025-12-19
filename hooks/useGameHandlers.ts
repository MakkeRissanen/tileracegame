import { useCallback } from "react";
import { Team } from "@/types/game";

interface UseGameHandlersProps {
  dispatch: (event: any) => Promise<void>;
  setTeam: (team: Team) => void;
  logout: () => void;
  setShowFormTeamsModal: (show: boolean) => void;
  setShowImportTasksModal: (show: boolean) => void;
  setShowImportPowerupsModal: (show: boolean) => void;
  setShowGradientSettingsModal: (show: boolean) => void;
  setShowAdminOptions: (show: boolean) => void;
  setIsAdmin: (isAdmin: boolean) => void;
}

export function useGameHandlers({
  dispatch,
  setTeam,
  logout,
  setShowFormTeamsModal,
  setShowImportTasksModal,
  setShowImportPowerupsModal,
  setShowGradientSettingsModal,
  setShowAdminOptions,
  setIsAdmin,
}: UseGameHandlersProps) {
  const handleSelectTeam = useCallback((team: Team, password: string) => {
    if (team.password === password) {
      setTeam(team);
    } else {
      alert("Incorrect password!");
    }
  }, [setTeam]);

  const handleLogout = useCallback(() => {
    if (confirm("Are you sure you want to logout?")) {
      logout();
    }
  }, [logout]);

  const handleCompleteTile = useCallback(async (teamId: string, playerNames: string[]) => {
    try {
      await dispatch({
        type: "COMPLETE_TILE",
        teamId,
        playerNames,
      });
    } catch (err) {
      alert(`Failed to complete tile: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }, [dispatch]);

  const handleClaimPowerupSubmit = useCallback(async (tileId: number, playerNames: string[]) => {
    try {
      await dispatch({
        type: "CLAIM_POWERUP_TILE",
        teamId: "", // Will be filled by caller
        powerTileId: tileId,
        playerNames,
      });
    } catch (err) {
      alert(`Failed to claim powerup: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }, [dispatch]);

  const handleUsePowerup = useCallback(async (powerupId: string, data: any) => {
    try {
      await dispatch({
        type: "USE_POWERUP",
        teamId: "", // Will be filled by caller
        powerupId,
        ...data,
      });
    } catch (err) {
      alert(`Failed to use powerup: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }, [dispatch]);

  const handleRandomizeDifficulties = useCallback(async () => {
    if (!confirm("Randomize tile difficulties? This will reassign difficulty levels to all tiles.")) return;
    try {
      await dispatch({
        type: "ADMIN_RANDOMIZE_DIFFICULTIES",
        weights: { easy: 20, medium: 20, hard: 16 },
      });
      setShowAdminOptions(false);
    } catch (err) {
      alert(`Failed to randomize difficulties: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }, [dispatch, setShowAdminOptions]);

  const handleRandomizeTiles = useCallback(async () => {
    if (!confirm("Randomize all tiles with tasks from the pool? This will replace current tile labels.")) return;
    try {
      await dispatch({
        type: "ADMIN_RANDOMIZE_BOARD",
      });
      setShowAdminOptions(false);
    } catch (err) {
      alert(`Failed to randomize tiles: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }, [dispatch, setShowAdminOptions]);

  const handleResetAll = useCallback(async () => {
    try {
      await dispatch({
        type: "RESET_ALL",
      });
      setShowAdminOptions(false);
      // Force logout after reset
      setIsAdmin(false);
      logout();
      // Reload page to ensure clean state
      window.location.reload();
    } catch (err) {
      alert(`Failed to reset game: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }, [dispatch, setShowAdminOptions, setIsAdmin, logout]);

  const handleFormTeamsApply = useCallback(async (teams: Array<{ name: string; captain: string; members: string[] }>) => {
    try {
      await dispatch({
        type: "ADMIN_APPLY_DRAFT_TEAMS",
        teams,
        adminName: "Admin",
      });
      setShowFormTeamsModal(false);
    } catch (err) {
      alert(`Failed to apply draft: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }, [dispatch, setShowFormTeamsModal]);

  const handleDisableFogOfWar = useCallback(async (mode: "none" | "admin" | "all") => {
    try {
      await dispatch({
        type: "ADMIN_SET_FOG_OF_WAR",
        mode,
      });
    } catch (err) {
      alert(`Failed to set fog of war: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }, [dispatch]);

  const handleImportTasks = useCallback(async (tasks: { difficulty: number; label: string; maxCompletions: number; minCompletions: number; instructions: string; image: string }[]) => {
    try {
      await dispatch({
        type: "ADMIN_IMPORT_POOL_TASKS",
        tasks,
      });
      setShowImportTasksModal(false);
    } catch (err) {
      alert(`Failed to import tasks: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }, [dispatch, setShowImportTasksModal]);

  const handleImportPowerups = useCallback(async (powerups: Array<{ powerupType: string; label: string; pointsPerCompletion: number; maxCompletions: number; minCompletions: number; claimType: "eachTeam" | "firstTeam" | "unlimited"; instructions: string; image: string }>) => {
    try {
      await dispatch({
        type: "ADMIN_IMPORT_POWERUPS",
        powerups,
      });
      setShowImportPowerupsModal(false);
    } catch (err) {
      alert(`Failed to import powerups: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }, [dispatch, setShowImportPowerupsModal]);

  const handleAddAdmin = useCallback(async (name: string, password: string, isMaster: boolean) => {
    try {
      await dispatch({
        type: "ADMIN_ADD_ADMIN",
        name,
        password,
        isMaster,
      });
    } catch (err) {
      alert(`Failed to add admin: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }, [dispatch]);

  const handleRemoveAdmin = useCallback(async (adminId: string) => {
    try {
      await dispatch({
        type: "ADMIN_REMOVE_ADMIN",
        adminId,
      });
    } catch (err) {
      alert(`Failed to remove admin: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }, [dispatch]);

  const handleChangePassword = useCallback(async (oldPassword: string, newPassword: string) => {
    try {
      await dispatch({
        type: "ADMIN_CHANGE_PASSWORD",
        oldPassword,
        newPassword,
      });
      alert("Password changed successfully!");
    } catch (err) {
      alert(`Failed to change password: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }, [dispatch]);

  const handleSetAllTeamPasswords = useCallback(async (password: string) => {
    try {
      await dispatch({
        type: "ADMIN_SET_ALL_TEAM_PASSWORDS",
        password,
      });
    } catch (err) {
      alert(`Failed to set team passwords: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }, [dispatch]);

  const handleSetTeamPassword = useCallback(async (teamId: string, password: string) => {
    try {
      await dispatch({
        type: "SET_TEAM_PASSWORD",
        teamId,
        password,
        adminName: "Admin",
      });
    } catch (err) {
      alert(`Failed to set team password: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }, [dispatch]);

  const handleUndo = useCallback(async () => {
    try {
      await dispatch({
        type: "ADMIN_UNDO",
      });
    } catch (err) {
      alert(`Failed to undo: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }, [dispatch]);

  const handleGradientSettings = useCallback(async (
    weights: { easy: number; medium: number; hard: number },
    gradient: boolean,
    earlyWeights?: { easy: number; medium: number; hard: number },
    lateWeights?: { easy: number; medium: number; hard: number }
  ) => {
    try {
      await dispatch({
        type: "ADMIN_RANDOMIZE_DIFFICULTIES",
        weights,
        gradient,
        early: earlyWeights,
        late: lateWeights,
      });
      setShowGradientSettingsModal(false);
    } catch (err) {
      alert(`Failed to apply gradient settings: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }, [dispatch, setShowGradientSettingsModal]);

  return {
    handleSelectTeam,
    handleLogout,
    handleCompleteTile,
    handleClaimPowerupSubmit,
    handleUsePowerup,
    handleRandomizeDifficulties,
    handleRandomizeTiles,
    handleResetAll,
    handleFormTeamsApply,
    handleDisableFogOfWar,
    handleImportTasks,
    handleImportPowerups,
    handleAddAdmin,
    handleRemoveAdmin,
    handleChangePassword,
    handleSetAllTeamPasswords,
    handleSetTeamPassword,
    handleUndo,
    handleGradientSettings,
  };
}
