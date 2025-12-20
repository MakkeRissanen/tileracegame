"use client";

import { useState } from "react";
import { GameState, Team } from "@/types/game";
import { Button, Modal, inputClass } from "./ui";

interface TeamsSidebarProps {
  game: GameState;
  isDark: boolean;
  myTeam: Team | null;
  isAdmin?: boolean;
  onCompleteTile: (teamId: string, playerNames: string[]) => void;
  onUsePowerup: () => void;
  onClaimPowerup?: (tileId: number) => void;
  onAdminUsePowerup?: (teamId: string) => void;
  onEditTeam?: (teamId: string) => void;
}

export default function TeamsSidebar({
  game,
  isDark,
  myTeam,
  isAdmin = false,
  onCompleteTile,
  onUsePowerup,
  onClaimPowerup,
  onAdminUsePowerup,
  onEditTeam,
}: TeamsSidebarProps) {
  const MAX_TILE = 56;
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);

  const getProgress = (team: Team) => {
    return Math.round((team.pos / MAX_TILE) * 100);
  };

  const getCurrentTile = (team: Team) => {
    const tile = game.raceTiles.find((t) => t.n === team.pos);
    return tile?.label || `Tile ${team.pos}`;
  };

  const handleOpenPlayerModal = (teamId: string) => {
    setActiveTeamId(teamId);
    setSelectedPlayers([]);
    setNewPlayerName("");
    setShowPlayerModal(true);
  };

  const handleAddPlayer = () => {
    if (newPlayerName.trim() && !selectedPlayers.includes(newPlayerName.trim())) {
      setSelectedPlayers([...selectedPlayers, newPlayerName.trim()]);
      setNewPlayerName("");
    }
  };

  const handleRemovePlayer = (player: string) => {
    setSelectedPlayers(selectedPlayers.filter((p) => p !== player));
  };

  const handleConfirmComplete = () => {
    if (activeTeamId && selectedPlayers.length > 0) {
      onCompleteTile(activeTeamId, selectedPlayers);
      setShowPlayerModal(false);
      setActiveTeamId(null);
      setSelectedPlayers([]);
    }
  };

  return (
    <>
      <div className="space-y-4">
      <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
        Teams
      </h2>
      
      {game.teams?.map((team) => {
        const progress = getProgress(team);
        const isMyTeam = myTeam?.id === team.id;
        const currentTile = getCurrentTile(team);

        return (
          <div
            key={team.id}
            className={`
              ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}
              border rounded-2xl shadow-sm p-4
              ${isMyTeam ? "ring-2 ring-blue-500" : ""}
            `}
          >
            {/* Team Header */}
            <div className="flex items-start justify-between mb-2">
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
            <p className={`text-sm mb-3 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              {currentTile}
            </p>

            {/* Team Members */}
            {team.members && team.members.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
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
            <div className="mb-2">
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

            {/* Powerup Count */}
            {team.inventory && team.inventory.length > 0 && (
              <p className={`text-xs mb-3 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                🎁 {team.inventory.length} powerup{team.inventory.length > 1 ? "s" : ""}
              </p>
            )}

            {/* Admin Action Buttons */}
            {isAdmin && (
              <div className="space-y-2 mb-3">
                <div className={`text-xs font-semibold mb-2 ${isDark ? "text-yellow-400" : "text-yellow-600"}`}>
                  👑 Admin Controls
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    isDark={isDark}
                    className="text-xs py-1.5"
                    onClick={() => handleOpenPlayerModal(team.id)}
                  >
                    ✅ Complete
                  </Button>
                  <Button
                    variant="secondary"
                    isDark={isDark}
                    className="text-xs py-1.5"
                    onClick={() => onEditTeam && onEditTeam(team.id)}
                  >
                    ✏️ Edit Team
                  </Button>
                  {team.inventory && team.inventory.length > 0 && (
                    <Button
                      variant="secondary"
                      isDark={isDark}
                      className="text-xs py-1.5"
                      onClick={() => onAdminUsePowerup && onAdminUsePowerup(team.id)}
                    >
                      🎁 Use Powerup
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons (only for logged-in team) */}
            {isMyTeam && (
              <div className="space-y-2">
                <Button
                  variant="primary"
                  isDark={isDark}
                  className="w-full"
                  onClick={() => handleOpenPlayerModal(team.id)}
                >
                  Complete Tile
                </Button>
                
                {/* Use Powerup Button */}
                {team.inventory && team.inventory.length > 0 && (
                  <Button
                    variant="secondary"
                    isDark={isDark}
                    className="w-full"
                    onClick={onUsePowerup}
                    disabled={team.powerupCooldown}
                  >
                    {team.powerupCooldown ? "🔒 Powerup Cooldown" : "🎁 Use Powerup"}
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>

      {/* Player Selection Modal */}
      {showPlayerModal && (
        <Modal isOpen={true} onClose={() => setShowPlayerModal(false)} isDark={isDark}>
          <div className="space-y-4">
            <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
              Select Players
            </h2>
            <p className={isDark ? "text-slate-300" : "text-slate-600"}>
              Who completed this tile? Add player names below.
            </p>

            {/* Add Player Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddPlayer()}
                placeholder="Player name"
                className={inputClass(isDark)}
              />
              <Button variant="primary" isDark={isDark} onClick={handleAddPlayer}>
                Add
              </Button>
            </div>

            {/* Selected Players */}
            {selectedPlayers.length > 0 && (
              <div className="space-y-2">
                <p className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  Selected players:
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedPlayers.map((player, idx) => (
                    <div
                      key={idx}
                      className={`
                        flex items-center gap-2 px-3 py-1 rounded-full text-sm
                        ${isDark ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-900"}
                      `}
                    >
                      <span>{player}</span>
                      <button
                        onClick={() => handleRemovePlayer(player)}
                        className={`font-bold ${isDark ? "hover:text-red-400" : "hover:text-red-600"}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
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
                onClick={handleConfirmComplete}
                disabled={selectedPlayers.length === 0}
                className="flex-1"
              >
                Complete Tile
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
