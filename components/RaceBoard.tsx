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
    1: "bg-emerald-800",
    2: "bg-amber-800",
    3: "bg-purple-800",
  };

  const difficultyBorderColors = {
    1: "border-emerald-400",
    2: "border-amber-400",
    3: "border-purple-400",
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

  // Create serpentine layout with proper snake pattern
  const createSerpentineLayout = () => {
    const rows: { tiles: RaceTile[]; isReversed: boolean }[] = [];
    let currentIndex = 0;
    
    while (currentIndex < game.raceTiles.length) {
      const rowNumber = rows.length;
      const isEvenRow = rowNumber % 2 === 0;
      
      // First row and every other pair of rows: 4 tiles left-to-right
      if (rowNumber % 4 === 0) {
        const tiles = game.raceTiles.slice(currentIndex, currentIndex + 4);
        rows.push({ tiles, isReversed: false });
        currentIndex += 4;
      }
      // Second row: 1 tile on the right (continuing from previous row)
      else if (rowNumber % 4 === 1) {
        const tiles = game.raceTiles.slice(currentIndex, currentIndex + 1);
        rows.push({ tiles, isReversed: false });
        currentIndex += 1;
      }
      // Third row: 4 tiles right-to-left
      else if (rowNumber % 4 === 2) {
        const tiles = game.raceTiles.slice(currentIndex, currentIndex + 4);
        rows.push({ tiles, isReversed: true });
        currentIndex += 4;
      }
      // Fourth row: 1 tile on the left (continuing from previous row)
      else {
        const tiles = game.raceTiles.slice(currentIndex, currentIndex + 1);
        rows.push({ tiles, isReversed: true });
        currentIndex += 1;
      }
    }
    
    return rows;
  };

  const serpentineRows = createSerpentineLayout();

  const renderTile = (tile: RaceTile) => {
    const teams = teamsOnTile(tile.n);
    const revealed = isRevealed(tile.n);
    const final = isFinalTile(tile.n);

    return (
      <div
        key={tile.n}
        onClick={() => handleTileClick(tile)}
        className={`
          ${final ? "col-span-4" : "col-span-1"}
          ${final ? "h-40" : "h-32"}
          ${revealed ? difficultyColors[tile.difficulty as 1 | 2 | 3] : isDark ? "bg-slate-800" : "bg-slate-700"}
          border-2 ${revealed ? difficultyBorderColors[tile.difficulty as 1 | 2 | 3] : isDark ? "border-slate-700" : "border-slate-600"}
          rounded-xl shadow-lg
          relative overflow-hidden
          transition-all duration-200
          ${myTeam?.pos === tile.n ? "ring-2 ring-blue-400" : ""}
          ${revealed ? "cursor-pointer hover:shadow-xl hover:scale-105" : ""}
        `}
      >
        {/* Tile Number */}
        <div className={`absolute top-1 left-2 text-xs font-mono ${revealed ? "text-white" : isDark ? "text-slate-400" : "text-slate-500"}`}>
          {tile.n}
        </div>

        {/* Powerup Badge */}
        {revealed && tile.rewardPowerupId && (
          <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-xs font-bold ${isDark ? "bg-yellow-900/60 text-yellow-100" : "bg-yellow-200 text-yellow-900"}`}>
            PWR
          </div>
        )}

        {/* Tile Content */}
        <div className="flex flex-col items-center justify-center h-full px-2 py-1">
          {!revealed ? (
            <div className={`text-4xl ${isDark ? "text-slate-600" : "text-slate-400"}`}>
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
              <p className={`text-center text-sm font-semibold line-clamp-2 text-white`}>
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
  };

  return (
    <>
      <div className={`space-y-3 max-w-5xl ${isDark ? "text-white" : "text-slate-900"}`}>
        {serpentineRows.map((row, rowIndex) => {
          const rowType = rowIndex % 4;
          const tilesToRender = row.isReversed ? [...row.tiles].reverse() : row.tiles;
          
          return (
            <div key={rowIndex} className="grid grid-cols-4 gap-3">
              {/* Empty cells for alignment */}
              {rowType === 1 && (
                <>
                  <div></div>
                  <div></div>
                  <div></div>
                </>
              )}
              
              {tilesToRender.map(renderTile)}
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
