"use client";

import { useState } from "react";
import Image from "next/image";
import { GameState, Team } from "@/types/game";
import { Button, Card, inputClass } from "./ui";

interface GameBoardProps {
  game: GameState;
  isDark: boolean;
  myTeam: Team | null;
  isAdmin?: boolean;
  adminName?: string;
  onCompleteTile: (teamId: string, playerNames: string[], adminName?: string) => void;
}

export default function GameBoard({ game, isDark, myTeam, isAdmin = false, adminName, onCompleteTile }: GameBoardProps) {
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
  
  const isRevealed = (() => {
    // If fog of war is disabled for everyone, reveal all tiles
    if (game.fogOfWarDisabled === "all") return true;
    // If fog of war is disabled for admin only and viewer is admin, reveal all tiles
    if (game.fogOfWarDisabled === "admin" && isAdmin) return true;
    // Otherwise, check normal revealed tiles
    return game.revealedTiles?.includes(myTeam.pos) ?? true;
  })();

  const handleAddPlayer = () => {
    if (newPlayerName.trim() && !selectedPlayers.includes(newPlayerName.trim())) {
      setSelectedPlayers([...selectedPlayers, newPlayerName.trim()]);
      setNewPlayerName("");
    }
  };

  const handleComplete = () => {
    if (selectedPlayers.length > 0) {
      onCompleteTile(myTeam.id, selectedPlayers, isAdmin ? (adminName || "Admin") : undefined);
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
          <Image
            src={currentTile.image}
            alt={currentTile.label}
            width={400}
            height={300}
            className="w-full max-w-md mx-auto mb-4 rounded-lg"
            unoptimized
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
              ⚡ Reward: {currentTile.rewardPowerupId}
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
