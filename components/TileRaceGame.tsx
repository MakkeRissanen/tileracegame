"use client";

import { useState, useEffect, useRef } from "react";
import { useGameSync } from "@/hooks/useGameSync";
import { useTeamSession } from "@/hooks/useTeamSession";
import { useGameHandlers } from "@/hooks/useGameHandlers";
import { GameState, Team, PowerupTile } from "@/types/game";
import ClaimPowerupModal from "./ClaimPowerupModal";
import SacrificeForTimeBombModal from "./SacrificeForTimeBombModal";
import UsePowerupModal from "./UsePowerupModal";
import TaskPoolsSection from "./TaskPoolsSection";
import GameHeader from "./GameHeader";
import AdminOptionsDropdown from "./AdminOptionsDropdown";
import AdminLoginModal from "./AdminLoginModal";
import VictoryModal from "./VictoryModal";
import MysteryPowerupResultModal from "./MysteryPowerupResultModal";
import TimeBombTriggerModal from "./TimeBombTriggerModal";
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
import ManageInsuredPowerupsModal from "./ManageInsuredPowerupsModal";
import EditPowerupTileModal from "./EditPowerupTileModal";
import EditPoolTaskModal from "./EditPoolTaskModal";
import ClaimPowerupConfirmModal from "./ClaimPowerupConfirmModal";
import PowerupClaimPlayerPickerModal from "./PowerupClaimPlayerPickerModal";
import RulebookModal from "./RulebookModal";
import { Modal } from "./ui";
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
  const [managingInsuredTeamId, setManagingInsuredTeamId] = useState<string | null>(null);
  const [editingPowerupTile, setEditingPowerupTile] = useState<PowerupTile | null>(null);
  const [editingPoolTask, setEditingPoolTask] = useState<PoolTask | null>(null);
  
  // Claim powerup modal states
  const [claimTeamId, setClaimTeamId] = useState<string | null>(null);
  const [claimSelectedPowerupTileId, setClaimSelectedPowerupTileId] = useState<number | null>(null);
  const [claimConfirmOpen, setClaimConfirmOpen] = useState(false);
  const [showSacrificeModal, setShowSacrificeModal] = useState(false);
  const [powerupClaimPickerOpen, setPowerupClaimPickerOpen] = useState(false);
  const [showMysteryResult, setShowMysteryResult] = useState(false);
  const [mysteryRewardId, setMysteryRewardId] = useState<string | null>(null);
  const [showBombTrigger, setShowBombTrigger] = useState(false);
  const [bombTriggerData, setBombTriggerData] = useState<{ bomberName: string; fromTile: number; toTile: number } | null>(null);
  const [adminBombVisibility, setAdminBombVisibility] = useState(false);
  const [showTimeBombReceived, setShowTimeBombReceived] = useState(false);
  
  // Track which log entries have been shown to prevent duplicate popups
  const shownLogIds = useRef<Set<string>>(new Set());

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

  // Detect mystery powerup usage for current team
  useEffect(() => {
    if (myTeam && game.log && game.log.length > 0) {
      const lastLog = game.log[game.log.length - 1];
      
      // Skip if we've already shown this log entry
      if (shownLogIds.current.has(lastLog.id)) {
        return;
      }
      
      const mysteryPattern = new RegExp(`${myTeam.name} used Mystery Powerup and received (.+?)! 🎁`);
      const match = lastLog.message.match(mysteryPattern);
      if (match) {
        const rewardLabel = match[1];
        const labelToId: Record<string, string> = {
          "Skip +1": "skip1",
          "Send Back 1": "back1",
          "Powerup Insurance": "powerupInsurance",
          "Steal Powerup": "stealPowerup",
          "Cooldown Lock": "cooldownLock",
          "Randomize Random Tile": "randomizeRandomTile",
          "Clear Cooldown": "clearCooldown"
        };
        const rewardId = labelToId[rewardLabel] || "skip1";
        setMysteryRewardId(rewardId);
        setShowMysteryResult(true);
        
        // Mark this log entry as shown
        shownLogIds.current.add(lastLog.id);
      }
    }
  }, [game.log, myTeam]);

  // Detect time bomb placement for current team (secret notification)
  useEffect(() => {
    if (myTeam && game.log && game.log.length > 0) {
      const lastLog = game.log[game.log.length - 1];
      // Check if this is a secret time bomb log for our team
      if (lastLog.isTimeBombSecret) {
        const bombPlacementPattern = new RegExp(`${myTeam.name} (?:used Time Bomb 💣|sacrificed \\d+ powerups for a Time Bomb) → placed time bomb on Tile (\\d+)`);
        const match = lastLog.message.match(bombPlacementPattern);
        if (match) {
          const tileNumber = match[1];
          alert(`💣 Time Bomb Planted on Tile ${tileNumber}!\n\n🔒 COMPLETE SECRECY: No one else can see this - not even admins. The bomb is invisible until triggered.`);
        }
      }
    }
  }, [game.log, myTeam]);

  // Detect time bomb trigger for current team
  useEffect(() => {
    if (myTeam && game.log && game.log.length > 0) {
      const lastLog = game.log[game.log.length - 1];
      
      // Skip if we've already shown this log entry
      if (shownLogIds.current.has(lastLog.id)) {
        return;
      }
      
      // Look for bomb trigger in the log message
      const bombPattern = new RegExp(`${myTeam.name} completed.*\n💣 Time bomb triggered! Pushed back from Tile (\d+) to Tile (\d+)`);
      const match = lastLog.message.match(bombPattern);
      if (match) {
        const fromTile = parseInt(match[1], 10);
        const toTile = parseInt(match[2], 10);
        // Find bomber name from game state
        if (game.lastBombTrigger) {
          const bomberTeam = game.teams.find(t => t.id === game.lastBombTrigger?.bombPlacer);
          const bomberName = bomberTeam ? bomberTeam.name : "Unknown";
          setBombTriggerData({ bomberName, fromTile, toTile });
          setShowBombTrigger(true);
          
          // Mark this log entry as shown
          shownLogIds.current.add(lastLog.id);
        }
      }
    }
  }, [game.log, game.lastBombTrigger, myTeam]);

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

  const handleAdminToggleCooldown = async (teamId: string, currentValue: number) => {
    const input = prompt(`Set cooldown value for this team (current: ${currentValue} tiles)\nEnter number of tiles (0 to clear):`, currentValue.toString());
    if (input === null) return; // User cancelled
    
    const cooldownValue = parseInt(input, 10);
    if (isNaN(cooldownValue) || cooldownValue < 0) {
      alert("Please enter a valid non-negative number");
      return;
    }
    
    try {
      await dispatch({
        type: "ADMIN_TOGGLE_COOLDOWN",
        teamId,
        cooldownValue,
        adminName: adminName || undefined,
      });
    } catch (err) {
      alert(`Failed to set cooldown: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleEditTeam = (teamId: string) => {
    setEditingTeamId(teamId);
  };

  const handleManageInsured = (teamId: string) => {
    setManagingInsuredTeamId(teamId);
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
            } else if (key === "insuredPowerups") {
              const oldLen = Array.isArray(oldValue) ? oldValue.length : 0;
              const newLen = Array.isArray(newValue) ? (newValue as any[]).length : 0;
              changes.push(`insured powerups: ${oldLen} → ${newLen}`);
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
      setManagingInsuredTeamId(null);
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
    // Allow opening modal to view powerups, but they'll be disabled if no team has reached tile 5
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

    // Close modals immediately to prevent double-click
    const teamId = claimTeamId;
    const tileId = claimSelectedPowerupTileId;
    setClaimTeamId(null);
    setClaimSelectedPowerupTileId(null);
    setClaimConfirmOpen(false);
    setPowerupClaimPickerOpen(false);

    try {
      await dispatch({
        type: "CLAIM_POWERUP_TILE",
        teamId: teamId,
        powerTileId: tileId,
        playerNames,
        ...(adminName && { adminName: adminName }),
      });
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

  // Backup download handler
  const handleDownloadBackup = () => {
    try {
      // Create a backup object with timestamp
      const backup = {
        timestamp: new Date().toISOString(),
        version: "1.0",
        gameState: game,
      };

      // Convert to JSON string
      const jsonString = JSON.stringify(backup, null, 2);
      
      // Create a blob and download link
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `tilerace-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Log the backup
      dispatch({
        type: "ADMIN_LOG_EVENT",
        message: `💾 ${adminName} downloaded game backup`,
        adminName: adminName || "Admin",
      });
    } catch (error) {
      console.error("Error downloading backup:", error);
      alert("Failed to download backup. Check console for details.");
    }
  };

  // Backup restore handler
  const handleRestoreBackup = () => {
    if (!confirm("⚠️ Are you sure you want to restore from a backup? This will overwrite ALL current game data!")) {
      return;
    }

    // Create a file input element
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const backup = JSON.parse(text);

        // Validate backup structure
        if (!backup.gameState || !backup.timestamp) {
          alert("Invalid backup file format. Missing required fields.");
          return;
        }

        // Confirm restore with timestamp
        const backupDate = new Date(backup.timestamp).toLocaleString();
        if (!confirm(`Restore backup from ${backupDate}?\n\nThis will overwrite all current game data.`)) {
          return;
        }

        // Restore the game state
        await dispatch({
          type: "RESTORE_BACKUP",
          gameState: backup.gameState,
          adminName: adminName || "Admin",
        });

        alert("✅ Backup restored successfully!");
        
        // Refresh the page to reload the restored state
        window.location.reload();
      } catch (error) {
        console.error("Error restoring backup:", error);
        alert("Failed to restore backup. Check console for details and ensure the file is valid.");
      }
    };

    input.click();
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
    <div className={`min-h-screen ${isDark ? "bg-slate-900" : "bg-slate-50"} p-2 md:p-4`}>
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
            adminBombVisibility={adminBombVisibility}
            onToggleBombVisibility={() => {
              const newValue = !adminBombVisibility;
              setAdminBombVisibility(newValue);
              setShowAdminOptions(false);
              // Log the visibility change
              dispatch({
                type: "ADMIN_LOG_EVENT",
                message: `👁️ ${adminName} ${newValue ? 'enabled' : 'disabled'} time bomb visibility`,
                adminName: adminName || "Admin",
              });
            }}
            onDownloadBackup={handleDownloadBackup}
            onRestoreBackup={handleRestoreBackup}
            onRecalculateFog={() => {
              dispatch({
                type: "ADMIN_RECALCULATE_FOG",
                adminName: adminName || "Admin",
              });
            }}
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
            onUsePowerup={handleOpenUsePowerup}
            onOpenClaimPowerup={handleOpenClaimPowerup}
            onAdminUsePowerup={handleAdminUsePowerup}
            onEditTeam={handleEditTeam}
            onManageInsured={handleManageInsured}
            onClearCooldown={handleClearCooldown}
            onAdminToggleCooldown={handleAdminToggleCooldown}
            onEditPoolTask={handleEditPoolTask}
            onClearPools={async () => {
              if (!confirm("Clear all task pools?")) return;
              await dispatch({ type: "ADMIN_CLEAR_TASK_POOLS" });
            }}
            onClaimPowerupFromBoard={handleClaimPowerupFromBoard}
            onEditPowerupTile={handleEditPowerupTile}
            dispatch={dispatch}
            adminBombVisibility={adminBombVisibility}
          />
        ) : (
          <MainGameLayout
            game={game}
            isDark={isDark}
            myTeam={myTeam}
            isAdmin={isAdmin}
            adminName={adminName || undefined}
            onUsePowerup={handleOpenUsePowerup}
            onOpenClaimPowerup={handleOpenClaimPowerup}
            onAdminUsePowerup={handleAdminUsePowerup}
            onEditTeam={handleEditTeam}
            onManageInsured={handleManageInsured}
            onClearCooldown={handleClearCooldown}
            onAdminToggleCooldown={handleAdminToggleCooldown}
            onEditPoolTask={handleEditPoolTask}
            onClearPools={async () => {
              if (!confirm("Clear all task pools?")) return;
              await dispatch({ type: "ADMIN_CLEAR_TASK_POOLS" });
            }}
            onClaimPowerupFromBoard={handleClaimPowerupFromBoard}
            onEditPowerupTile={handleEditPowerupTile}
            dispatch={dispatch}
            adminBombVisibility={adminBombVisibility}
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

        {/* Mystery Powerup Result Modal */}
        <MysteryPowerupResultModal
          isOpen={showMysteryResult}
          isDark={isDark}
          rewardPowerupId={mysteryRewardId}
          onClose={() => {
            setShowMysteryResult(false);
            setMysteryRewardId(null);
          }}
        />

        {/* Time Bomb Trigger Modal */}
        {bombTriggerData && (
          <TimeBombTriggerModal
            isOpen={showBombTrigger}
            isDark={isDark}
            bomberName={bombTriggerData.bomberName}
            fromTile={bombTriggerData.fromTile}
            toTile={bombTriggerData.toTile}
            onClose={() => {
              setShowBombTrigger(false);
              setBombTriggerData(null);
            }}
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

        {/* Manage Insured Powerups Modal */}
        {managingInsuredTeamId && (() => {
          const team = game.teams.find((t) => t.id === managingInsuredTeamId);
          return team ? (
            <ManageInsuredPowerupsModal
              isOpen={true}
              isDark={isDark}
              team={team}
              game={game}
              onClose={() => setManagingInsuredTeamId(null)}
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
            onSacrificeForTimeBomb={() => {
              setShowSacrificeModal(true);
            }}
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

        {/* Sacrifice for Time Bomb Modal */}
        {showSacrificeModal && claimTeamId && (
          <SacrificeForTimeBombModal
            isOpen={true}
            team={game.teams.find((t) => t.id === claimTeamId)!}
            onClose={() => setShowSacrificeModal(false)}
            onConfirm={(powerupIndices) => {
              // Get the powerup IDs from indices
              const team = game.teams.find((t) => t.id === claimTeamId);
              if (!team) return;
              
              const sacrificedPowerups = powerupIndices.map(idx => team.inventory[idx]);
              
              dispatch({
                type: "SACRIFICE_FOR_TIMEBOMB",
                teamId: claimTeamId,
                sacrificedPowerups,
                adminName: isAdmin && adminName ? adminName : undefined,
              });
              
              setShowSacrificeModal(false);
              setShowTimeBombReceived(true);
            }}
          />
        )}

        {/* Time Bomb Received Confirmation Modal */}
        {showTimeBombReceived && (
          <Modal isOpen={true} onClose={() => setShowTimeBombReceived(false)} isDark={isDark} maxWidth="max-w-md" title="💣 Time Bomb Acquired!">
            <div className="text-center space-y-4">
              <div className="text-6xl">💣</div>
              <p className="text-slate-300">
                You have successfully obtained a <strong>Time Bomb</strong>. It has been automatically insured and added to your inventory.
              </p>
              <p className="text-sm text-green-300 font-semibold">
                🛡️ This powerup is protected and cannot be stolen or disabled!
              </p>
              <p className="text-sm text-blue-300 font-semibold">
                🔒 Complete secrecy: No one else knows you have this - not even admins!
              </p>
              <p className="text-sm text-yellow-300 font-semibold">
                💬 Want to strategize? Discuss with your team in a private channel!
              </p>
              <button
                onClick={() => setShowTimeBombReceived(false)}
                className="mt-4 px-6 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold transition-colors"
              >
                Got it!
              </button>
            </div>
          </Modal>
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
