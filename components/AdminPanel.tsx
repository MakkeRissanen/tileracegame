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
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState("");
  const [showImportPowerupsModal, setShowImportPowerupsModal] = useState(false);
  const [importPowerupsData, setImportPowerupsData] = useState("");

  const handleImportCSV = async () => {
    try {
      const lines = importData.trim().split("\n");
      if (lines.length === 0) {
        alert("No data to import");
        return;
      }

      // Parse CSV: label, difficulty, max completions, min completions, instructions, url
      const tasks = lines.map((line) => {
        const parts = line.split("\t").length > 1 ? line.split("\t") : line.split(",");
        const [label, difficulty, maxCompletions, minCompletions, instructions, image] = parts;
        
        return {
          difficulty: (parseInt(difficulty) || 1) as 1 | 2 | 3,
          label: label?.trim() || "",
          instructions: instructions?.trim() || "",
          image: image?.trim() || "",
        };
      });

      // Dispatch the import event to add to task pools
      await dispatch({
        type: "ADMIN_IMPORT_POOL_TASKS",
        tasks: tasks,
      });

      alert(`Successfully imported ${tasks.length} tasks to pools!`);
      setShowImportModal(false);
      setImportData("");
    } catch (err) {
      alert(`Failed to import: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleImportPowerups = async () => {
    try {
      const lines = importPowerupsData.trim().split("\n");
      if (lines.length === 0) {
        alert("No data to import");
        return;
      }

      // Parse powerup CSV: powerupid,tasklabel,points/completion,max completions,min completions,claimtype,instructions,url
      for (const line of lines) {
        const parts = line.split("\t").length > 1 ? line.split("\t") : line.split(",");
        const [powerupId, label, points, maxComp, minComp, claimType, instructions, image] = parts;
        
        await dispatch({
          type: "ADMIN_CREATE_POWERUP_TILE",
          label: label?.trim() || "",
          rewardPowerupId: powerupId?.trim() || "",
          instructions: instructions?.trim() || "",
          image: image?.trim() || "",
          pointsPerCompletion: parseInt(points) || 1,
          maxCompletions: parseInt(maxComp) || 1,
          minCompletions: parseInt(minComp) || 1,
          claimType: (claimType?.trim() as "eachTeam" | "firstTeam" | "unlimited") || "eachTeam",
        });
      }

      alert(`Successfully imported ${lines.length} powerup tiles!`);
      setShowImportPowerupsModal(false);
      setImportPowerupsData("");
    } catch (err) {
      alert(`Failed to import: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Input validation
    if (!adminPassword.trim()) {
      alert("Please enter a password");
      return;
    }
    
    const admin = game.admins?.find((a) => a.password === adminPassword.trim());
    if (admin) {
      setIsLoggedIn(true);
    } else {
      alert("Incorrect admin password!");
    }
  };

  const handleCreateTeam = async () => {
    const teamName = newTeamName.trim();
    
    // Input validation
    if (!teamName) {
      alert("Please enter a team name");
      return;
    }
    
    if (teamName.length > 50) {
      alert("Team name must be 50 characters or less");
      return;
    }
    
    if (!/^[a-zA-Z0-9\s-_]+$/.test(teamName)) {
      alert("Team name can only contain letters, numbers, spaces, hyphens, and underscores");
      return;
    }
    
    // Check for duplicate team names
    if (game.teams?.some((t) => t.name.toLowerCase() === teamName.toLowerCase())) {
      alert("A team with this name already exists");
      return;
    }
    
    try {
      await dispatch({
        type: "ADD_TEAM",
        name: teamName,
        adminName: "Admin",
      });
      setNewTeamName("");
      setShowCreateTeam(false);
    } catch (err) {
      alert(`Failed to create team: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleSetPassword = async () => {
    const password = teamPassword.trim();
    
    // Input validation
    if (!selectedTeamForPassword) {
      alert("No team selected");
      return;
    }
    
    if (!password) {
      alert("Please enter a password");
      return;
    }
    
    if (password.length < 4) {
      alert("Password must be at least 4 characters");
      return;
    }
    
    if (password.length > 50) {
      alert("Password must be 50 characters or less");
      return;
    }
    
    try {
      await dispatch({
        type: "SET_TEAM_PASSWORD",
        teamId: selectedTeamForPassword,
        password: password,
        adminName: "Admin",
      });
      setShowPasswordModal(false);
      setSelectedTeamForPassword(null);
      setTeamPassword("");
    } catch (err) {
      alert(`Failed to set password: ${err instanceof Error ? err.message : "Unknown error"}`);
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
            <Button onClick={() => setShowImportModal(true)} variant="secondary" isDark={isDark}>
              Import Tiles
            </Button>
            <Button onClick={() => setShowImportPowerupsModal(true)} variant="secondary" isDark={isDark}>
              Import Powerups
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
          {!game.teams || game.teams.length === 0 ? (
            <p className={isDark ? "text-slate-400" : "text-slate-600"}>
              No teams created yet. Click "Create Team" to add one.
            </p>
          ) : (
            <div className="space-y-3">
              {game.teams?.map((team) => (
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

        {/* Task Pools */}
        <Card isDark={isDark} className="p-6">
          <h2 className={`text-2xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
            Task Pools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {[1, 2, 3].map((difficulty) => {
              const pool = game.taskPools?.[difficulty] || [];
              const unusedCount = pool.filter((t) => !t.used).length;
              return (
                <div
                  key={difficulty}
                  className={`p-4 rounded-lg ${
                    isDark ? "bg-slate-700/50" : "bg-slate-100"
                  }`}
                >
                  <div className={`font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                    Difficulty {difficulty}
                  </div>
                  <div className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    Total: {pool.length} tasks
                  </div>
                  <div className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    Unused: {unusedCount} tasks
                  </div>
                  
                  {/* List tasks */}
                  {pool.length > 0 && (
                    <div className="mt-3 space-y-1 max-h-48 overflow-y-auto">
                      {pool.map((task) => (
                        <div
                          key={task.id}
                          className={`text-xs p-2 rounded ${
                            task.used
                              ? isDark ? "bg-slate-800/50 text-slate-500" : "bg-slate-200 text-slate-500"
                              : isDark ? "bg-slate-800 text-slate-300" : "bg-white text-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate flex-1" title={task.label}>
                              {task.label}
                            </span>
                            {task.used && <span className="ml-2 text-xs">✓</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex gap-3 mt-4">
            <Button
              onClick={async () => {
                if (confirm("Randomize tile difficulties with weighted distribution? This will clear task assignments.")) {
                  try {
                    await dispatch({ 
                      type: "ADMIN_RANDOMIZE_DIFFICULTIES",
                      weights: { easy: 50, medium: 35, hard: 15 },
                      gradient: false,
                    });
                    alert("Tile difficulties randomized! Use 'Randomize Race Board' to assign tasks.");
                  } catch (err) {
                    alert(`Failed to randomize: ${err instanceof Error ? err.message : "Unknown error"}`);
                  }
                }
              }}
              variant="secondary"
              isDark={isDark}
              className="flex-1"
            >
              Randomize Difficulties
            </Button>
            <Button
              onClick={async () => {
                if (confirm("Randomize race board with tasks from pools?")) {
                  try {
                    await dispatch({ type: "ADMIN_RANDOMIZE_BOARD" });
                    alert("Race board randomized!");
                  } catch (err) {
                    alert(`Failed to randomize: ${err instanceof Error ? err.message : "Unknown error"}`);
                  }
                }
              }}
              variant="primary"
              isDark={isDark}
              className="flex-1"
            >
              Randomize Race Board
            </Button>
          </div>
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
            {game.log?.slice(0, 20).map((entry) => (
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

        {/* Import CSV Modal */}
        <Modal
          isOpen={showImportModal}
          onClose={() => {
            setShowImportModal(false);
            setImportData("");
          }}
          title="Import Race Tiles (CSV/TSV)"
          isDark={isDark}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <p className={isDark ? "text-slate-300" : "text-slate-600"}>
              Paste your tile data below. Each line should contain:
              <br />
              <code className="text-sm">label, difficulty, maxCompletions, minCompletions, instructions, imageUrl</code>
              <br />
              <span className="text-xs">Tiles will be auto-numbered starting from 1</span>
            </p>
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              className={`${inputClass(isDark)} min-h-[300px] font-mono text-sm`}
              placeholder="Steel ring,1,1,1,Complete the task,https://example.com/image.png"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setShowImportModal(false);
                  setImportData("");
                }}
                variant="secondary"
                isDark={isDark}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleImportCSV} variant="primary" isDark={isDark} className="flex-1">
                Import
              </Button>
            </div>
          </div>
        </Modal>

        {/* Import Powerup Tiles Modal */}
        <Modal
          isOpen={showImportPowerupsModal}
          onClose={() => {
            setShowImportPowerupsModal(false);
            setImportPowerupsData("");
          }}
          title="Import Powerup Tiles (CSV/TSV)"
          isDark={isDark}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <p className={isDark ? "text-slate-300" : "text-slate-600"}>
              Paste your powerup tile data below. Each line should contain:
              <br />
              <code className="text-sm">powerupId, label, points/completion, maxCompletions, minCompletions, claimType, instructions, imageUrl</code>
              <br />
              <span className="text-xs">ClaimType: eachTeam, firstTeam, or unlimited</span>
            </p>
            <textarea
              value={importPowerupsData}
              onChange={(e) => setImportPowerupsData(e.target.value)}
              className={`${inputClass(isDark)} min-h-[300px] font-mono text-sm`}
              placeholder="skip1,Skip forward task,1,1,1,eachTeam,Complete to skip forward,https://example.com/image.png"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setShowImportPowerupsModal(false);
                  setImportPowerupsData("");
                }}
                variant="secondary"
                isDark={isDark}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleImportPowerups} variant="primary" isDark={isDark} className="flex-1">
                Import
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
