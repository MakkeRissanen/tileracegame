"use client";

import { useState, memo } from "react";
import { GameState, Team, RaceTile } from "@/types/game";
import { Modal, Button } from "./ui";
import { diffTint } from "@/lib/gameUtils";

interface RaceBoardProps {
  game: GameState;
  isDark: boolean;
  myTeam: Team | null;
  isAdmin?: boolean;
}

function RaceBoard({ game, isDark, myTeam, isAdmin = false }: RaceBoardProps) {
  const [selectedTile, setSelectedTile] = useState<RaceTile | null>(null);
  const difficultyColors = {
    1: "bg-emerald-800",
    2: "bg-yellow-800",
    3: "bg-purple-900",
  };

  const difficultyBorderColors = {
    1: "border-emerald-600",
    2: "border-yellow-600",
    3: "border-purple-600",
  };

  const difficultyLabels = {
    1: "Easy",
    2: "Medium",
    3: "Hard",
  };

  const isRevealed = (n: number) => {
    // If fog of war is disabled for everyone, reveal all tiles
    if (game.fogOfWarDisabled === "all") return true;
    // If fog of war is disabled for admin only and viewer is admin, reveal all tiles
    if (game.fogOfWarDisabled === "admin" && isAdmin) return true;
    // Otherwise, check normal revealed tiles
    return game.revealedTiles?.includes(n) ?? false;
  };
  
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
          ${final ? "h-48" : "h-36"}
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
                <div className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
                  <img
                    src={tile.image}
                    alt=""
                    className="w-20 h-20 object-contain mb-2"
                  />
                </div>
              )}
              <p 
                className={`text-center text-sm font-semibold line-clamp-2 text-white mt-1`}
                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
              >
                {tile.label}
              </p>
            </>
          )}
        </div>

        {/* Status Badges */}
        {revealed && (
          <div className="absolute bottom-12 right-1 flex gap-1">
            {game.copyPasteTiles?.includes(tile.n) && (
              <span className={`px-2 py-1 rounded-lg text-[10px] font-bold shadow-lg border-2 ${isDark ? "bg-blue-600 text-white border-blue-400" : "bg-blue-500 text-white border-blue-300"}`}>
                Copied
              </span>
            )}
            {game.changedTiles?.includes(tile.n) && (
              <span className={`px-2 py-1 rounded-lg text-[10px] font-bold shadow-lg border-2 ${isDark ? "bg-purple-600 text-white border-purple-400" : "bg-purple-500 text-white border-purple-300"}`}>
                Changed
              </span>
            )}
            {game.doubledTiles?.includes(tile.n) && (
              <span className={`px-3 py-1.5 rounded-lg text-lg font-bold shadow-lg border-2 ${isDark ? "bg-orange-600 text-white border-orange-400" : "bg-orange-500 text-white border-orange-300"}`}>
                2×
              </span>
            )}
          </div>
        )}

        {/* Team Position Markers */}
        {teams.length > 0 && (
          <div className="absolute bottom-12 -left-1 flex flex-col gap-0.5 items-start">
            {teams.slice(0, 3).map((team, idx) => (
              <span
                key={team.id}
                className={`inline-block px-2 py-0.5 rounded-full font-bold text-black ${team.color} whitespace-nowrap ${
                  teams.length > 1 ? 'text-[10px]' : 'text-xs'
                }`}
              >
                {team.name}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className={`space-y-3 w-full ${isDark ? "text-white" : "text-slate-900"}`}>
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

            {/* Tile Preview with Image and Instructions in Colored Box */}
            <div className={`rounded-xl border-2 p-4 ${diffTint(selectedTile.difficulty, isDark)}`}>
              <div className="flex flex-col items-center">
                {selectedTile.image && (
                  <img
                    src={selectedTile.image}
                    alt={selectedTile.label}
                    className="w-32 h-32 object-contain mb-3"
                  />
                )}
                <p className="text-center text-lg font-semibold mb-2">
                  {selectedTile.label}
                </p>
                {selectedTile.instructions && (
                  <p className={`text-center text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {selectedTile.instructions}
                  </p>
                )}
              </div>
            </div>

            {selectedTile.rewardPowerupId && (
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                  isDark ? "bg-yellow-900/60 text-yellow-100" : "bg-yellow-200 text-yellow-900"
                }`}>
                  ⚡ Reward: {selectedTile.rewardPowerupId}
                </span>
              </div>
            )}

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

export default memo(RaceBoard, (prevProps, nextProps) => {
  // Only re-render if relevant game state has changed
  return (
    prevProps.isDark === nextProps.isDark &&
    prevProps.myTeam?.id === nextProps.myTeam?.id &&
    prevProps.myTeam?.pos === nextProps.myTeam?.pos &&
    prevProps.isAdmin === nextProps.isAdmin &&
    prevProps.game.raceTiles === nextProps.game.raceTiles &&
    prevProps.game.revealedTiles === nextProps.game.revealedTiles &&
    prevProps.game.fogOfWarDisabled === nextProps.game.fogOfWarDisabled &&
    JSON.stringify(prevProps.game.teams.map(t => ({ id: t.id, pos: t.pos, name: t.name }))) === 
    JSON.stringify(nextProps.game.teams.map(t => ({ id: t.id, pos: t.pos, name: t.name })))
  );
});
