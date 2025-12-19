"use client";

import { useState, useEffect } from "react";
import { useGameSync } from "@/hooks/useGameSync";
import { useTeamSession } from "@/hooks/useTeamSession";
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

  // Check for victory
  useEffect(() => {
    const winner = game.teams?.find((t) => t.pos >= 56);
    if (winner && !showVictoryModal) {
      setWinningTeam(winner);
      setShowVictoryModal(true);
    }
  }, [game.teams, showVictoryModal]);

  const handleSelectTeam = (team: Team, password: string) => {
    if (team.password === password) {
      setTeam(team);
    } else {
      alert("Incorrect password!");
    }
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      logout();
    }
  };

  const handleCompleteTile = async (teamId: string, playerNames: string[]) => {
    try {
      await dispatch({
        type: "COMPLETE_TILE",
        teamId,
        playerNames,
      });
    } catch (err) {
      alert(`Failed to complete tile: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

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

  const handleRandomizeDifficulties = async () => {
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
  };

  const handleRandomizeTiles = async () => {
    if (!confirm("Randomize all tiles with tasks from the pool? This will replace current tile labels.")) return;
    try {
      await dispatch({
        type: "ADMIN_RANDOMIZE_BOARD",
      });
      setShowAdminOptions(false);
    } catch (err) {
      alert(`Failed to randomize tiles: ${err instanceof Error ? err.message : "Unknown error"}`);
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
          onLogout={handleLogout}
        >
          <AdminOptionsDropdown
            isDark={isDark}
            onClose={() => setShowAdminOptions(false)}
            onRandomizeDifficulties={handleRandomizeDifficulties}
            onRandomizeTiles={handleRandomizeTiles}
          />
        </GameHeader>

        {!myTeam ? (
          <TeamSelect game={game} isDark={isDark} onSelectTeam={handleSelectTeam} />
        ) : (
          <MainGameLayout
            game={game}
            isDark={isDark}
            myTeam={myTeam}
            isAdmin={isAdmin}
            onCompleteTile={handleCompleteTile}
            onUsePowerup={() => setShowUsePowerupModal(true)}
            onClaimPowerup={handleClaimPowerup}
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
      </div>
    </div>
  );
}
