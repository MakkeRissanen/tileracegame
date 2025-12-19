"use client";

import { useState, useEffect } from "react";
import { useGameSync } from "@/hooks/useGameSync";
import { useTeamSession } from "@/hooks/useTeamSession";
import { Button, Card, inputClass, Modal } from "./ui";
import { GameState, Team, PowerupTile } from "@/types/game";
import RaceBoard from "./RaceBoard";
import TeamsSidebar from "./TeamsSidebar";
import EventLog from "./EventLog";
import PowerupTilesBoard from "./PowerupTilesBoard";
import ClaimPowerupModal from "./ClaimPowerupModal";
import UsePowerupModal from "./UsePowerupModal";
import PlayerPointsSidebar from "./PlayerPointsSidebar";
import TaskPoolsSection from "./TaskPoolsSection";

interface GameBoardProps {
  game: GameState;
  isDark: boolean;
  myTeam: Team | null;
  onCompleteTile: (teamId: string, playerNames: string[]) => void;
}

function GameBoard({ game, isDark, myTeam, onCompleteTile }: GameBoardProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");

  if (!myTeam) {
    return (
      <Card isDark={isDark} className="text-center p-8">
        <p className={isDark ? "text-slate-300" : "text-slate-600"}>
          Please select a team to start playing
        </p>
      </Card>
    );
  }

  const currentTile = game.raceTiles.find((t) => t.n === myTeam.pos);
  const isRevealed = game.revealedTiles?.includes(myTeam.pos) ?? true;

  const handleAddPlayer = () => {
    if (newPlayerName.trim() && !selectedPlayers.includes(newPlayerName.trim())) {
      setSelectedPlayers([...selectedPlayers, newPlayerName.trim()]);
      setNewPlayerName("");
    }
  };

  const handleComplete = () => {
    if (selectedPlayers.length > 0) {
      onCompleteTile(myTeam.id, selectedPlayers);
      setSelectedPlayers([]);
      setNewPlayerName("");
    }
  };

  if (!currentTile) {
    return (
      <Card isDark={isDark} className="text-center p-8">
        <p className={isDark ? "text-red-300" : "text-red-600"}>Error: Current tile not found</p>
      </Card>
    );
  }

  if (!isRevealed) {
    return (
      <Card isDark={isDark} className="text-center p-8">
        <p className={isDark ? "text-slate-300" : "text-slate-600"}>
          Tile {myTeam.pos} is not revealed yet. Complete more tiles to unlock!
        </p>
      </Card>
    );
  }

  const difficultyColors = {
    1: "bg-emerald-500",
    2: "bg-amber-500",
    3: "bg-purple-500",
  };

  const difficultyLabels = {
    1: "Easy",
    2: "Medium",
    3: "Hard",
  };

  return (
    <div className="space-y-4">
      <Card isDark={isDark} className="p-6">
        <h2 className={`text-2xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
          Current Tile: {currentTile.n}
        </h2>

        {currentTile.image && (
          <img
            src={currentTile.image}
            alt={currentTile.label}
            className="w-full max-w-md mx-auto mb-4 rounded-lg"
          />
        )}

        <p className={`text-lg mb-4 ${isDark ? "text-slate-200" : "text-slate-700"}`}>
          {currentTile.label}
        </p>

        {currentTile.instructions && (
          <p className={`text-sm mb-4 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            {currentTile.instructions}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          <span
            className={`px-3 py-1 rounded-lg text-sm font-semibold text-white ${
              difficultyColors[currentTile.difficulty as 1 | 2 | 3]
            }`}
          >
            {difficultyLabels[currentTile.difficulty as 1 | 2 | 3]}
          </span>

          {currentTile.rewardPowerupId && (
            <span
              className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                isDark ? "bg-yellow-900/60 text-yellow-100" : "bg-yellow-200 text-yellow-900"
              }`}
            >
              🎁 Reward: {currentTile.rewardPowerupId}
            </span>
          )}
        </div>

        <div className="mb-4 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddPlayer()}
              placeholder="Player name"
              className={inputClass(isDark)}
            />
            <Button onClick={handleAddPlayer} variant="secondary" isDark={isDark}>
              Add
            </Button>
          </div>

          {selectedPlayers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedPlayers.map((player, idx) => (
                <span
                  key={idx}
                  className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 ${
                    isDark ? "bg-blue-900/40 text-blue-100" : "bg-blue-100 text-blue-900"
                  }`}
                >
                  {player}
                  <button
                    onClick={() => setSelectedPlayers(selectedPlayers.filter((p) => p !== player))}
                    className="font-bold hover:text-red-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <Button
          onClick={handleComplete}
          variant="primary"
          isDark={isDark}
          disabled={selectedPlayers.length < (currentTile.minCompletions || 1)}
          className="w-full"
        >
          Complete Tile ({selectedPlayers.length}/{currentTile.minCompletions || 1} players)
        </Button>
      </Card>

      {myTeam.inventory && myTeam.inventory.length > 0 && (
        <Card isDark={isDark} className="p-6">
          <h3 className={`text-lg font-semibold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>
            Your Powerups
          </h3>
          <div className="flex flex-wrap gap-2">
            {myTeam.inventory.map((powerupId, idx) => (
              <div
                key={idx}
                className={`px-3 py-2 rounded-lg text-sm ${
                  isDark ? "bg-blue-900/40 text-blue-100" : "bg-blue-100 text-blue-900"
                }`}
              >
                {powerupId}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

interface TeamSelectProps {
  game: GameState;
  isDark: boolean;
  onSelectTeam: (team: Team, password: string) => void;
}

function TeamSelect({ game, isDark, onSelectTeam }: TeamSelectProps) {
  const [teamName, setTeamName] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Input validation
    const trimmedTeamName = teamName.trim();
    const trimmedPassword = password.trim();
    
    if (!trimmedTeamName) {
      alert("Please enter a team name");
      return;
    }
    
    if (trimmedTeamName.length > 50) {
      alert("Team name is too long");
      return;
    }
    
    if (!trimmedPassword) {
      alert("Please enter a password");
      return;
    }
    
    // Find team by name (case-insensitive)
    const team = game.teams?.find(
      (t) => t.name.toLowerCase() === trimmedTeamName.toLowerCase()
    );
    
    if (team) {
      onSelectTeam(team, trimmedPassword);
    } else {
      alert("Team not found. Please check the team name.");
    }
  };

  return (
    <Card isDark={isDark} className="p-8 max-w-md mx-auto">
      <h2 className={`text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-slate-900"}`}>
        Select Your Team
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
            Team Name
          </label>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className={inputClass(isDark)}
            placeholder="Enter your team name"
            required
          />
          {game.teams.filter((t) => t.password).length > 0 && (
            <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Available teams: {game.teams.filter((t) => t.password).map((t) => t.name).join(", ")}
            </p>
          )}
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass(isDark)}
            placeholder="Enter team password"
            required
          />
        </div>

        <Button type="submit" variant="primary" isDark={isDark} className="w-full">
          Log in
        </Button>
      </form>
    </Card>
  );
}

export default function TileRaceGame() {
  const { game, loading, dispatch } = useGameSync();
  const [isDark] = useState(true);
  const { myTeam, setTeam, logout, isRestoring } = useTeamSession(game.teams || []);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [winningTeam, setWinningTeam] = useState<Team | null>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedPowerupTile, setSelectedPowerupTile] = useState<PowerupTile | null>(null);
  const [showUsePowerupModal, setShowUsePowerupModal] = useState(false);
  const [showPlayerPoints, setShowPlayerPoints] = useState(false);
  const [showAdminOptions, setShowAdminOptions] = useState(false);
  const [isAdmin] = useState(true); // TODO: Implement proper admin authentication

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
    <div className={`min-h-screen ${isDark ? "bg-slate-900" : "bg-slate-50"} p-4 md:p-8`}>
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1 className={`text-4xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
              Tile Race Game
            </h1>
            <p className={`mt-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Real-time multiplayer tile racing competition
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Player Points Toggle */}
            <Button
              onClick={() => setShowPlayerPoints(!showPlayerPoints)}
              variant="secondary"
              isDark={isDark}
            >
              📊 Points
            </Button>

            {/* Admin Options */}
            {isAdmin && myTeam && (
              <div className="relative">
                <Button
                  onClick={() => setShowAdminOptions(!showAdminOptions)}
                  variant="secondary"
                  isDark={isDark}
                >
                  ⚙️ Options
                </Button>
                {showAdminOptions && (
                  <div
                    className={`
                      absolute right-0 top-full mt-2 z-50 w-64 rounded-xl border shadow-lg max-h-[80vh] overflow-y-auto
                      ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}
                    `}
                  >
                    <button
                      onClick={() => {
                        setShowAdminOptions(false);
                        alert("Form teams (Draft) - Coming soon!");
                      }}
                      className={`
                        w-full px-4 py-3 text-left text-sm border-b
                        ${isDark ? "hover:bg-slate-700 text-slate-100 border-slate-700" : "hover:bg-slate-50 text-slate-900 border-slate-200"}
                      `}
                    >
                      👥 Form teams
                    </button>
                    <button
                      onClick={() => {
                        setShowAdminOptions(false);
                        alert("Import tasks - Coming soon!");
                      }}
                      className={`
                        w-full px-4 py-3 text-left text-sm border-b
                        ${isDark ? "hover:bg-slate-700 text-slate-100 border-slate-700" : "hover:bg-slate-50 text-slate-900 border-slate-200"}
                      `}
                    >
                      📥 Import tasks
                    </button>
                    <button
                      onClick={() => {
                        setShowAdminOptions(false);
                        alert("Import powerups - Coming soon!");
                      }}
                      className={`
                        w-full px-4 py-3 text-left text-sm border-b
                        ${isDark ? "hover:bg-slate-700 text-slate-100 border-slate-700" : "hover:bg-slate-50 text-slate-900 border-slate-200"}
                      `}
                    >
                      📦 Import powerups
                    </button>
                    <button
                      onClick={() => {
                        setShowAdminOptions(false);
                        alert("Gradient settings - Coming soon!");
                      }}
                      className={`
                        w-full px-4 py-3 text-left text-sm border-b
                        ${isDark ? "hover:bg-slate-700 text-slate-100 border-slate-700" : "hover:bg-slate-50 text-slate-900 border-slate-200"}
                      `}
                    >
                      📊 Gradient settings
                    </button>
                    <button
                      onClick={handleRandomizeDifficulties}
                      className={`
                        w-full px-4 py-3 text-left text-sm border-b
                        ${isDark ? "hover:bg-slate-700 text-slate-100 border-slate-700" : "hover:bg-slate-50 text-slate-900 border-slate-200"}
                      `}
                    >
                      🎲 Randomize difficulties
                    </button>
                    <button
                      onClick={handleRandomizeTiles}
                      className={`
                        w-full px-4 py-3 text-left text-sm border-b
                        ${isDark ? "hover:bg-slate-700 text-slate-100 border-slate-700" : "hover:bg-slate-50 text-slate-900 border-slate-200"}
                      `}
                    >
                      🎲 Randomize tiles
                    </button>
                    <button
                      onClick={() => {
                        setShowAdminOptions(false);
                        alert("Fog of War toggle - Coming soon!");
                      }}
                      className={`
                        w-full px-4 py-3 text-left text-sm border-b
                        ${isDark ? "hover:bg-slate-700 text-slate-100 border-slate-700" : "hover:bg-slate-50 text-slate-900 border-slate-200"}
                      `}
                    >
                      👁️ Disable Fog of War (Testing)
                    </button>
                    <button
                      onClick={() => {
                        setShowAdminOptions(false);
                        alert("Download backup - Coming soon!");
                      }}
                      className={`
                        w-full px-4 py-3 text-left text-sm border-b
                        ${isDark ? "hover:bg-slate-700 text-slate-100 border-slate-700" : "hover:bg-slate-50 text-slate-900 border-slate-200"}
                      `}
                    >
                      💾 Download Game Backup
                    </button>
                    <button
                      onClick={() => {
                        setShowAdminOptions(false);
                        alert("Restore backup - Coming soon!");
                      }}
                      className={`
                        w-full px-4 py-3 text-left text-sm border-b
                        ${isDark ? "hover:bg-slate-700 text-slate-100 border-slate-700" : "hover:bg-slate-50 text-slate-900 border-slate-200"}
                      `}
                    >
                      📂 Restore Game Backup
                    </button>
                    <button
                      onClick={() => {
                        setShowAdminOptions(false);
                        alert("Manage admins - Coming soon!");
                      }}
                      className={`
                        w-full px-4 py-3 text-left text-sm border-b
                        ${isDark ? "hover:bg-slate-700 text-slate-100 border-slate-700" : "hover:bg-slate-50 text-slate-900 border-slate-200"}
                      `}
                    >
                      👤 Manage Admins
                    </button>
                    <button
                      onClick={() => {
                        setShowAdminOptions(false);
                        alert("Change password - Coming soon!");
                      }}
                      className={`
                        w-full px-4 py-3 text-left text-sm border-b
                        ${isDark ? "hover:bg-slate-700 text-slate-100 border-slate-700" : "hover:bg-slate-50 text-slate-900 border-slate-200"}
                      `}
                    >
                      🔑 Change Password
                    </button>
                    <button
                      onClick={() => {
                        setShowAdminOptions(false);
                        alert("Set team passwords - Coming soon!");
                      }}
                      className={`
                        w-full px-4 py-3 text-left text-sm border-b
                        ${isDark ? "hover:bg-slate-700 text-slate-100 border-slate-700" : "hover:bg-slate-50 text-slate-900 border-slate-200"}
                      `}
                    >
                      🔐 Set Team Passwords
                    </button>
                    <button
                      onClick={() => {
                        setShowAdminOptions(false);
                        alert("Undo - Coming soon!");
                      }}
                      className={`
                        w-full px-4 py-3 text-left text-sm border-b
                        ${isDark ? "hover:bg-slate-700 text-slate-100 border-slate-700" : "hover:bg-slate-50 text-slate-900 border-slate-200"}
                      `}
                    >
                      ↩️ Undo
                    </button>
                    <button
                      onClick={() => {
                        setShowAdminOptions(false);
                        if (confirm("Reset entire game? This cannot be undone!")) {
                          alert("Reset all - Coming soon!");
                        }
                      }}
                      className={`
                        w-full px-4 py-3 text-left text-sm
                        ${isDark ? "hover:bg-slate-700 text-red-400 border-slate-700" : "hover:bg-slate-50 text-red-600 border-slate-200"}
                      `}
                    >
                      🔄 Reset all
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {myTeam && (
              <>
                <div className="text-right">
                  <div className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    Logged in as
                  </div>
                  <div className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                    {myTeam.name}
                  </div>
                </div>
                <Button onClick={handleLogout} variant="secondary" isDark={isDark}>
                  Logout
                </Button>
              </>
            )}
          </div>
        </header>

        {!myTeam ? (
          <TeamSelect game={game} isDark={isDark} onSelectTeam={handleSelectTeam} />
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_340px] gap-6">
              {/* Left Sidebar - Teams */}
              <div>
                <TeamsSidebar
                  game={game}
                  isDark={isDark}
                  myTeam={myTeam}
                  onCompleteTile={handleCompleteTile}
                  onUsePowerup={() => setShowUsePowerupModal(true)}
                />
              </div>

              {/* Center - Race Board */}
              <div>
                <RaceBoard game={game} isDark={isDark} myTeam={myTeam} />
              </div>

              {/* Right Sidebar - Event Log */}
              <div>
                <EventLog game={game} isDark={isDark} />
              </div>
            </div>

            {/* Powerup Tiles Board */}
            <PowerupTilesBoard
              game={game}
              isDark={isDark}
              myTeam={myTeam}
              onClaimPowerup={handleClaimPowerup}
            />

            {/* Task Pools (Admin Only) */}
            {isAdmin && myTeam && (
              <TaskPoolsSection
                game={game}
                isDark={isDark}
                onClearPools={async () => {
                  if (!confirm("Clear all task pools?")) return;
                  await dispatch({ type: "ADMIN_CLEAR_TASK_POOLS" });
                }}
              />
            )}
          </div>
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

        {/* Victory Modal */}
        {showVictoryModal && winningTeam && (
          <Modal isOpen={true} onClose={() => setShowVictoryModal(false)} isDark={isDark}>
            <div className="text-center space-y-6 py-8">
              <div className="text-6xl">🏆🎉</div>
              <h1 className={`text-4xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                GAME OVER!
              </h1>
              <div>
                <p className={`text-2xl font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  {winningTeam.name} completed the Final Tile!
                </p>
                <p className={`text-xl ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  {winningTeam.members.join(", ")} {winningTeam.members.length === 1 ? "is" : "are"} the WINNER{winningTeam.members.length === 1 ? "" : "S"}!
                </p>
              </div>
              <div className="text-6xl">🏆🎉</div>
              <Button
                variant="primary"
                isDark={isDark}
                onClick={() => setShowVictoryModal(false)}
                className="w-full"
              >
                Continue Viewing
              </Button>
            </div>
          </Modal>
        )}

        {/* Player Points Sidebar */}
        <PlayerPointsSidebar
          game={game}
          isDark={isDark}
          isOpen={showPlayerPoints}
          onClose={() => setShowPlayerPoints(false)}
        />
      </div>
    </div>
  );
}
