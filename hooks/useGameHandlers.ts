import { useCallback } from "react";
import { Team, GameState } from "@/types/game";

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
  game: GameState;
  adminName: string | null;
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
  game,
  adminName,
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

  const handleCompleteTile = useCallback(async (teamId: string, playerNames: string[], adminName?: string) => {
    try {
      await dispatch({
        type: "COMPLETE_TILE",
        teamId,
        playerNames,
        ...(adminName && { adminName }),
      });
    } catch (err) {
      alert(`Failed to complete tile: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }, [dispatch]);

  const handleClaimPowerupSubmit = useCallback(async (tileId: number, playerNames: string[], adminName?: string) => {
    try {
      await dispatch({
        type: "CLAIM_POWERUP_TILE",
        teamId: "", // Will be filled by caller
        powerTileId: tileId,
        playerNames,
        ...(adminName && { adminName }),
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

  const handleRandomizeDifficulties = useCallback(async (gradientSettings?: { weights: { easy: number; medium: number; hard: number }; gradient: boolean; early?: { easy: number; medium: number; hard: number }; late?: { easy: number; medium: number; hard: number } }) => {
    if (!confirm("Randomize tile difficulties? This will reassign difficulty levels to all tiles.")) return;
    try {
      await dispatch({
        type: "ADMIN_RANDOMIZE_DIFFICULTIES",
        weights: gradientSettings?.weights,
        gradient: gradientSettings?.gradient,
        early: gradientSettings?.early,
        late: gradientSettings?.late,
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
        adminName: adminName || undefined,
      });
      setShowFormTeamsModal(false);
    } catch (err) {
      alert(`Failed to apply draft: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }, [dispatch, setShowFormTeamsModal, adminName]);

  const handleDisableFogOfWar = useCallback(async (mode: "none" | "admin" | "all") => {
    try {
      await dispatch({
        type: "ADMIN_SET_FOG_OF_WAR",
        mode,
        adminName,
      });
    } catch (err) {
      alert(`Failed to set fog of war: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }, [dispatch, adminName]);

  const handleImportTasks = useCallback(async (tasks: { difficulty: number; label: string; maxCompletions: number; minCompletions: number; instructions: string; image: string; startProofNeeded?: boolean }[]) => {
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
        adminName: adminName || undefined,
      });
    } catch (err) {
      alert(`Failed to set team password: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }, [dispatch, adminName]);

  const handleUndo = useCallback(async (adminName?: string, targetIndex?: number) => {
    try {
      // Extract information about what's being undone
      const history = game.eventHistory || [];
      if (history.length === 0) {
        alert("Nothing to undo - no history available");
        return;
      }
      
      let undoneMessage: string;
      let targetState: GameState;
      
      if (targetIndex !== undefined && targetIndex >= 0 && targetIndex < history.length) {
        // Undo to specific point - collect all actions being undone
        targetState = history[targetIndex];
        
        // Collect all log messages between target state and current state
        const undoneActions: string[] = [];
        const targetLogIds = new Set(targetState.log?.map(l => l.id) || []);
        
        // Get all logs from current state that aren't in target state
        if (game.log) {
          for (const log of game.log) {
            if (!targetLogIds.has(log.id)) {
              // Strip undo prefixes and admin names to get clean action
              let cleanMessage = log.message;
              // Remove undo prefix
              while (cleanMessage.startsWith("⎌ Undid: ")) {
                cleanMessage = cleanMessage.substring("⎌ Undid: ".length);
              }
              // Remove admin name prefix
              const adminPrefixMatch = cleanMessage.match(/^\[([^\]]+)\]\n/);
              if (adminPrefixMatch) {
                cleanMessage = cleanMessage.substring(adminPrefixMatch[0].length);
              }
              undoneActions.push(cleanMessage);
            }
          }
        }
        
        // Reverse to show in chronological order (oldest first)
        undoneActions.reverse();
        
        const numActionsUndone = undoneActions.length;
        if (numActionsUndone > 0) {
          undoneMessage = `${numActionsUndone} action(s):\n${undoneActions.map((action, i) => `${i + 1}. ${action}`).join('\n')}`;
        } else {
          undoneMessage = `${history.length - targetIndex} action(s) to restore earlier state`;
        }
      } else {
        // Undo last action
        undoneMessage = game.log && game.log.length > 0 
          ? game.log[0].message 
          : "last action";
        targetState = history[history.length - 1];
      }
      
      // Find affected teams by comparing current state to target state
      const affectedTeamIds: string[] = [];
      
      game.teams.forEach((currentTeam, idx) => {
        const targetTeam = targetState.teams[idx];
        if (targetTeam && (
          currentTeam.pos !== targetTeam.pos ||
          JSON.stringify(currentTeam.playerPoints) !== JSON.stringify(targetTeam.playerPoints) ||
          currentTeam.inventory?.length !== targetTeam.inventory?.length
        )) {
          affectedTeamIds.push(currentTeam.id);
        }
      });
      
      await dispatch({
        type: "ADMIN_UNDO",
        ...(adminName && { adminName }),
        undoneMessage,
        affectedTeamIds,
        ...(targetIndex !== undefined && { targetHistoryIndex: targetIndex }),
      });
    } catch (err) {
      alert(`Failed to undo: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }, [dispatch, game]);

  const handleGradientSettings = useCallback(async (
    weights: { easy: number; medium: number; hard: number },
    gradient: boolean,
    earlyWeights?: { easy: number; medium: number; hard: number },
    lateWeights?: { easy: number; medium: number; hard: number }
  ) => {
    if (!confirm("Apply gradient settings and randomize difficulties? This will reassign difficulty levels and tasks to all tiles.")) return;
    try {
      await dispatch({
        type: "ADMIN_RANDOMIZE_DIFFICULTIES",
        weights,
        gradient,
        early: earlyWeights,
        late: lateWeights,
      });
      
      // Small delay to let state update, then check for errors
      setTimeout(() => {
        // Check the game's recent logs for errors (this will be checked in the component after state updates)
        setShowGradientSettingsModal(false);
      }, 100);
    } catch (err) {
      alert(`Failed to apply gradient settings: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }, [dispatch, setShowGradientSettingsModal]);

  const handleSaveGradientSettings = useCallback(async (
    weights: { easy: number; medium: number; hard: number },
    gradient: boolean,
    earlyWeights?: { easy: number; medium: number; hard: number },
    lateWeights?: { easy: number; medium: number; hard: number }
  ) => {
    try {
      await dispatch({
        type: "ADMIN_SAVE_GRADIENT_SETTINGS",
        weights,
        gradient,
        early: earlyWeights,
        late: lateWeights,
      });
      setShowGradientSettingsModal(false);
    } catch (err) {
      alert(`Failed to save gradient settings: ${err instanceof Error ? err.message : "Unknown error"}`);
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
    handleSaveGradientSettings,
  };
}
