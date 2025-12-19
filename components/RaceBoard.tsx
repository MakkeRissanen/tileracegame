"use client";

import { useState } from "react";
import { GameState, Team, RaceTile } from "@/types/game";
import { Modal, Button } from "./ui";

interface RaceBoardProps {
  game: GameState;
  isDark: boolean;
  myTeam: Team | null;
}

export default function RaceBoard({ game, isDark, myTeam }: RaceBoardProps) {
  const [selectedTile, setSelectedTile] = useState<RaceTile | null>(null);
  const difficultyColors = {
    1: isDark ? "bg-emerald-900/40" : "bg-emerald-200/80",
    2: isDark ? "bg-amber-900/40" : "bg-amber-200/90",
    3: isDark ? "bg-purple-900/40" : "bg-purple-200/80",
  };

  const difficultyLabels = {
    1: "Easy",
    2: "Medium",
    3: "Hard",
  };

  const isRevealed = (n: number) => game.revealedTiles?.includes(n) ?? false;
  
  const teamsOnTile = (n: number) => {
    return game.teams?.filter((t) => t.pos === n) || [];
  };

  const isFinalTile = (n: number) => n === 56;

  const handleTileClick = (tile: RaceTile) => {
    if (isRevealed(tile.n)) {
      setSelectedTile(tile);
    }
  };

  return (
    <>
      <div className={`grid grid-cols-4 gap-3 ${isDark ? "text-white" : "text-slate-900"}`}>
      {game.raceTiles.map((tile) => {
        const teams = teamsOnTile(tile.n);
        const revealed = isRevealed(tile.n);
        const final = isFinalTile(tile.n);

        return (
          <div
            key={tile.n}
            onClick={() => handleTileClick(tile)}
            className={`
              ${final ? "col-span-4" : "col-span-1"}
              ${final ? "h-36" : "h-28"}
              ${isDark ? "bg-slate-800" : "bg-white"}
              border ${isDark ? "border-slate-700" : "border-slate-200"}
              rounded-2xl shadow-sm
              relative overflow-hidden
              transition-all duration-200
              ${myTeam?.pos === tile.n ? "ring-2 ring-blue-500" : ""}
              ${revealed ? "cursor-pointer hover:shadow-lg" : ""}
            `}
          >
            {/* Tile Number */}
            <div className={`absolute top-1 left-2 text-xs font-mono ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {tile.n}
            </div>

            {/* Difficulty Badge */}
            {revealed && (
              <div className={`absolute top-1 right-1 px-2 py-0.5 rounded text-xs font-semibold ${difficultyColors[tile.difficulty as 1 | 2 | 3]}`}>
                {difficultyLabels[tile.difficulty as 1 | 2 | 3]}
              </div>
            )}

            {/* Powerup Badge */}
            {revealed && tile.rewardPowerupId && (
              <div className={`absolute top-1 right-16 px-1.5 py-0.5 rounded text-xs font-bold ${isDark ? "bg-yellow-900/60 text-yellow-100" : "bg-yellow-200 text-yellow-900"}`}>
                PWR
              </div>
            )}

            {/* Tile Content */}
            <div className="flex flex-col items-center justify-center h-full px-2 py-1">
              {!revealed ? (
                <div className={`text-4xl ${isDark ? "text-slate-600" : "text-slate-300"}`}>
                  ?
                </div>
              ) : (
                <>
                  {tile.image && (
                    <img
                      src={tile.image}
                      alt=""
                      className="w-12 h-12 object-contain mb-1"
                    />
                  )}
                  <p className={`text-center text-sm font-semibold line-clamp-2 ${isDark ? "text-slate-100" : "text-slate-800"}`}>
                    {tile.label}
                  </p>
                </>
              )}
            </div>

            {/* Status Badges */}
            {revealed && (
              <div className="absolute bottom-1 right-1 flex gap-1">
                {game.changedTiles?.includes(tile.n) && (
                  <span className={`px-1.5 py-0.5 rounded text-xs ${isDark ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-700"}`}>
                    •
                  </span>
                )}
                {game.doubledTiles?.includes(tile.n) && (
                  <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${isDark ? "bg-orange-900/60 text-orange-100" : "bg-orange-200 text-orange-900"}`}>
                    2×
                  </span>
                )}
              </div>
            )}

            {/* Team Position Markers */}
            {teams.length > 0 && (
              <div className="absolute bottom-1 left-1 flex flex-col gap-0.5">
                {teams.slice(0, 3).map((team, idx) => (
                  <div
                    key={team.id}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${team.color}`}
                    style={{
                      transform: teams.length > 1 ? `scale(${1 - idx * 0.1})` : undefined,
                    }}
                  >
                    {team.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>

      {/* Tile Details Modal */}
      {selectedTile && (
        <Modal isOpen={true} onClose={() => setSelectedTile(null)} isDark={isDark}>
          <div className="space-y-4">
            <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
              Tile #{selectedTile.n}
            </h2>

            {selectedTile.image && (
              <img
                src={selectedTile.image}
                alt={selectedTile.label}
                className="w-full max-w-md mx-auto rounded-lg"
              />
            )}

            <div>
              <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                {selectedTile.label}
              </h3>
              <p className={isDark ? "text-slate-300" : "text-slate-600"}>
                {selectedTile.instructions || "No additional instructions."}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                difficultyColors[selectedTile.difficulty as 1 | 2 | 3]
              }`}>
                {difficultyLabels[selectedTile.difficulty as 1 | 2 | 3]}
              </span>
              {selectedTile.rewardPowerupId && (
                <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                  isDark ? "bg-yellow-900/60 text-yellow-100" : "bg-yellow-200 text-yellow-900"
                }`}>
                  🎁 Reward: {selectedTile.rewardPowerupId}
                </span>
              )}
            </div>

            <div className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              <p>Min completions: {selectedTile.minCompletions}</p>
              <p>Max completions: {selectedTile.maxCompletions}</p>
            </div>

            <Button
              variant="secondary"
              isDark={isDark}
              onClick={() => setSelectedTile(null)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
