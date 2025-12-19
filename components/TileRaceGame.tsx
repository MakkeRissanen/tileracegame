"use client";

import { useState } from "react";
import { useGameSync } from "@/hooks/useGameSync";
import { Button, Card, inputClass } from "./ui";
import { GameState, Team } from "@/types/game";

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
    }
  };

  if (!currentTile || !isRevealed) {
    return (
      <Card isDark={isDark} className="p-8">
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
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                Tile {currentTile.n}: {currentTile.label}
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
                  difficultyColors[currentTile.difficulty]
                }`}
              >
                {difficultyLabels[currentTile.difficulty]}
              </span>
            </div>

            {currentTile.instructions && (
              <p className={`mb-4 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                {currentTile.instructions}
              </p>
            )}

            {currentTile.image && (
              <img
                src={currentTile.image}
                alt={currentTile.label}
                className="max-w-md rounded-lg mb-4"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}

            <div className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Required: {currentTile.minCompletions} - {currentTile.maxCompletions} player
              {currentTile.maxCompletions > 1 ? "s" : ""}
            </div>
          </div>

          <div className={`text-right ${myTeam.color} px-4 py-2 rounded-lg text-white font-bold`}>
            {myTeam.name}
            <div className="text-sm font-normal opacity-90">Position: {myTeam.pos}</div>
          </div>
        </div>
      </Card>

      <Card isDark={isDark} className="p-6">
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
          Complete Tile
        </h3>

        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddPlayer()}
              placeholder="Enter player name"
              className={inputClass(isDark)}
            />
            <Button onClick={handleAddPlayer} variant="secondary" isDark={isDark}>
              Add
            </Button>
          </div>

          {selectedPlayers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedPlayers.map((name, idx) => (
                <div
                  key={idx}
                  className={`px-3 py-1 rounded-full text-sm ${
                    isDark
                      ? "bg-slate-700 text-slate-100"
                      : "bg-slate-100 text-slate-900"
                  } flex items-center gap-2`}
                >
                  {name}
                  <button
                    onClick={() => setSelectedPlayers(selectedPlayers.filter((_, i) => i !== idx))}
                    className="hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={handleComplete}
            variant="primary"
            isDark={isDark}
            disabled={
              selectedPlayers.length < currentTile.minCompletions ||
              selectedPlayers.length > currentTile.maxCompletions
            }
            className="w-full"
          >
            Complete Tile ({selectedPlayers.length}/{currentTile.minCompletions}-
            {currentTile.maxCompletions})
          </Button>
        </div>
      </Card>

      {myTeam.inventory && myTeam.inventory.length > 0 && (
        <Card isDark={isDark} className="p-6">
          <h3 className={`text-lg font-semibold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>
            Powerup Inventory
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
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const team = game.teams.find((t) => t.id === selectedTeamId);
    if (team) {
      onSelectTeam(team, password);
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
            Team
          </label>
          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className={inputClass(isDark)}
            required
          >
            <option value="">-- Select a team --</option>
            {game.teams
              .filter((t) => t.password) // Only show teams with passwords set
              .map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
          </select>
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
            required
          />
        </div>

        <Button type="submit" variant="primary" isDark={isDark} className="w-full">
          Join Team
        </Button>
      </form>
    </Card>
  );
}

export default function TileRaceGame() {
  const { game, loading, dispatch } = useGameSync();
  const [isDark] = useState(true);
  const [myTeam, setMyTeam] = useState<Team | null>(null);

  const handleSelectTeam = (team: Team, password: string) => {
    if (team.password === password) {
      setMyTeam(team);
    } else {
      alert("Incorrect password!");
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

  if (loading) {
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
        <header className="mb-8">
          <h1 className={`text-4xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
            Tile Race Game
          </h1>
          <p className={`mt-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Real-time multiplayer tile racing competition
          </p>
        </header>

        {!myTeam ? (
          <TeamSelect game={game} isDark={isDark} onSelectTeam={handleSelectTeam} />
        ) : (
          <>
            <div className="mb-4 flex justify-end">
              <Button onClick={() => setMyTeam(null)} variant="secondary" isDark={isDark}>
                Change Team
              </Button>
            </div>
            <GameBoard
              game={game}
              isDark={isDark}
              myTeam={myTeam}
              onCompleteTile={handleCompleteTile}
            />
          </>
        )}

        {/* Team Standings */}
        {game.teams.length > 0 && (
          <Card isDark={isDark} className="mt-8 p-6">
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
              Team Standings
            </h3>
            <div className="space-y-2">
              {[...game.teams]
                .sort((a, b) => b.pos - a.pos)
                .map((team) => (
                  <div
                    key={team.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      isDark ? "bg-slate-700/50" : "bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded ${team.color}`}></div>
                      <span className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                        {team.name}
                      </span>
                    </div>
                    <span className={isDark ? "text-slate-300" : "text-slate-600"}>
                      Tile {team.pos} / 56
                    </span>
                  </div>
                ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
