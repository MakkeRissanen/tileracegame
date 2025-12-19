"use client";

import { useState } from "react";
import { useGameSync } from "@/hooks/useGameSync";
import { Button, Card, inputClass, Modal } from "./ui";
import { GameState } from "@/types/game";

export default function AdminPanel() {
  const { game, loading, dispatch } = useGameSync();
  const [isDark] = useState(true);
  const [adminPassword, setAdminPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedTeamForPassword, setSelectedTeamForPassword] = useState<string | null>(null);
  const [teamPassword, setTeamPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const admin = game.admins.find((a) => a.password === adminPassword);
    if (admin) {
      setIsLoggedIn(true);
    } else {
      alert("Incorrect admin password!");
    }
  };

  const handleCreateTeam = async () => {
    if (newTeamName.trim()) {
      try {
        await dispatch({
          type: "ADD_TEAM",
          name: newTeamName.trim(),
          adminName: "Admin",
        });
        setNewTeamName("");
        setShowCreateTeam(false);
      } catch (err) {
        alert(`Failed to create team: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }
  };

  const handleSetPassword = async () => {
    if (selectedTeamForPassword && teamPassword.trim()) {
      try {
        await dispatch({
          type: "SET_TEAM_PASSWORD",
          teamId: selectedTeamForPassword,
          password: teamPassword.trim(),
          adminName: "Admin",
        });
        setShowPasswordModal(false);
        setSelectedTeamForPassword(null);
        setTeamPassword("");
      } catch (err) {
        alert(`Failed to set password: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }
  };

  const handleEditTile = async (tileN: number) => {
    const tile = game.raceTiles.find((t) => t.n === tileN);
    if (!tile) return;

    const newLabel = prompt("Enter new label:", tile.label);
    if (newLabel !== null) {
      try {
        await dispatch({
          type: "ADMIN_EDIT_RACE_TILE",
          n: tileN,
          label: newLabel,
          difficulty: tile.difficulty,
          rewardPowerupId: tile.rewardPowerupId,
          instructions: tile.instructions,
          image: tile.image,
          maxCompletions: tile.maxCompletions,
          minCompletions: tile.minCompletions,
        });
      } catch (err) {
        alert(`Failed to edit tile: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? "bg-slate-900" : "bg-slate-50"} p-8`}>
        <div className="text-center">
          <div className={`text-xl ${isDark ? "text-white" : "text-slate-900"}`}>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen ${isDark ? "bg-slate-900" : "bg-slate-50"} p-8`}>
        <Card isDark={isDark} className="max-w-md mx-auto mt-20 p-8">
          <h2 className={`text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-slate-900"}`}>
            Admin Login
          </h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDark ? "text-slate-300" : "text-slate-700"
                }`}
              >
                Password
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className={inputClass(isDark)}
                placeholder="Enter admin password"
                required
              />
              <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Default: admin123
              </p>
            </div>
            <Button type="submit" variant="primary" isDark={isDark} className="w-full">
              Login
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? "bg-slate-900" : "bg-slate-50"} p-4 md:p-8`}>
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className={`text-4xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
              Admin Panel
            </h1>
            <p className={`mt-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Manage teams, tiles, and game settings
            </p>
          </div>
          <div className="space-x-2">
            <Button onClick={() => setShowCreateTeam(true)} variant="primary" isDark={isDark}>
              Create Team
            </Button>
            <Button
              onClick={async () => {
                if (confirm("Are you sure you want to reset the entire game?")) {
                  try {
                    await dispatch({ type: "RESET_ALL" });
                  } catch (err) {
                    alert(`Failed to reset game: ${err instanceof Error ? err.message : "Unknown error"}`);
                  }
                }
              }}
              variant="danger"
              isDark={isDark}
            >
              Reset Game
            </Button>
          </div>
        </header>

        {/* Teams Management */}
        <Card isDark={isDark} className="mb-8 p-6">
          <h2 className={`text-2xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
            Teams
          </h2>
          {game.teams.length === 0 ? (
            <p className={isDark ? "text-slate-400" : "text-slate-600"}>
              No teams created yet. Click "Create Team" to add one.
            </p>
          ) : (
            <div className="space-y-3">
              {game.teams.map((team) => (
                <div
                  key={team.id}
                  className={`p-4 rounded-lg ${
                    isDark ? "bg-slate-700/50" : "bg-slate-100"
                  } flex items-center justify-between`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 rounded ${team.color}`}></div>
                    <div>
                      <div className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                        {team.name}
                      </div>
                      <div className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                        Position: Tile {team.pos} | Inventory: {team.inventory.length} powerups
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setSelectedTeamForPassword(team.id);
                        setShowPasswordModal(true);
                      }}
                      variant={team.password ? "secondary" : "primary"}
                      isDark={isDark}
                    >
                      {team.password ? "Change Password" : "Set Password"}
                    </Button>
                    <Button
                      onClick={async () => {
                        if (confirm(`Remove team "${team.name}"?`)) {
                          try {
                            await dispatch({ type: "REMOVE_TEAM", teamId: team.id });
                          } catch (err) {
                            alert(`Failed to remove team: ${err instanceof Error ? err.message : "Unknown error"}`);
                          }
                        }
                      }}
                      variant="danger"
                      isDark={isDark}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Tiles Quick Edit */}
        <Card isDark={isDark} className="p-6">
          <h2 className={`text-2xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
            Race Tiles
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
            {game.raceTiles.slice(0, 20).map((tile) => (
              <button
                key={tile.n}
                onClick={() => handleEditTile(tile.n)}
                className={`p-3 rounded-lg text-center ${
                  isDark ? "bg-slate-700 hover:bg-slate-600" : "bg-slate-100 hover:bg-slate-200"
                } transition-colors`}
              >
                <div className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                  {tile.n}
                </div>
                <div
                  className={`text-xs truncate ${isDark ? "text-slate-400" : "text-slate-600"}`}
                >
                  {tile.label}
                </div>
              </button>
            ))}
          </div>
          <p className={`text-sm mt-4 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Click a tile to edit its label. Showing first 20 tiles.
          </p>
        </Card>

        {/* Event Log */}
        <Card isDark={isDark} className="mt-8 p-6">
          <h2 className={`text-2xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
            Event Log
          </h2>
          <div className="space-y-2 max-h-64 overflow-y-auto dark-scrollbar">
            {game.log.slice(0, 20).map((entry) => (
              <div
                key={entry.id}
                className={`text-sm p-2 rounded ${
                  isDark ? "bg-slate-700/30" : "bg-slate-50"
                }`}
              >
                <span className={isDark ? "text-slate-400" : "text-slate-500"}>
                  {new Date(entry.ts).toLocaleTimeString()}
                </span>{" "}
                <span className={isDark ? "text-slate-200" : "text-slate-700"}>
                  {entry.message}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Create Team Modal */}
        <Modal
          isOpen={showCreateTeam}
          onClose={() => setShowCreateTeam(false)}
          title="Create New Team"
          isDark={isDark}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDark ? "text-slate-300" : "text-slate-700"
                }`}
              >
                Team Name
              </label>
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className={inputClass(isDark)}
                placeholder="Enter team name"
              />
            </div>
            <Button onClick={handleCreateTeam} variant="primary" isDark={isDark} className="w-full">
              Create Team
            </Button>
          </div>
        </Modal>

        {/* Set Password Modal */}
        <Modal
          isOpen={showPasswordModal}
          onClose={() => {
            setShowPasswordModal(false);
            setSelectedTeamForPassword(null);
            setTeamPassword("");
          }}
          title="Set Team Password"
          isDark={isDark}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDark ? "text-slate-300" : "text-slate-700"
                }`}
              >
                Password
              </label>
              <input
                type="text"
                value={teamPassword}
                onChange={(e) => setTeamPassword(e.target.value)}
                className={inputClass(isDark)}
                placeholder="Enter team password"
              />
            </div>
            <Button onClick={handleSetPassword} variant="primary" isDark={isDark} className="w-full">
              Set Password
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  );
}
