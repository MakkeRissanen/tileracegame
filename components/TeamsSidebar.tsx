"use client";

import { GameState, Team } from "@/types/game";
import { Button } from "./ui";

interface TeamsSidebarProps {
  game: GameState;
  isDark: boolean;
  myTeam: Team | null;
  onCompleteTile: (teamId: string, playerNames: string[]) => void;
}

export default function TeamsSidebar({
  game,
  isDark,
  myTeam,
  onCompleteTile,
}: TeamsSidebarProps) {
  const MAX_TILE = 56;

  const getProgress = (team: Team) => {
    return Math.round((team.pos / MAX_TILE) * 100);
  };

  const getCurrentTile = (team: Team) => {
    const tile = game.raceTiles.find((t) => t.n === team.pos);
    return tile?.label || `Tile ${team.pos}`;
  };

  return (
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
                      ${member === team.captain
                        ? `${team.color} text-white`
                        : isDark
                        ? "bg-slate-700 text-slate-300"
                        : "bg-slate-100 text-slate-700"
                      }
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

            {/* Action Buttons (only for logged-in team) */}
            {isMyTeam && (
              <div className="space-y-2">
                <Button
                  variant="primary"
                  isDark={isDark}
                  className="w-full"
                  onClick={() => {
                    const players = prompt("Enter player names (comma-separated):");
                    if (players) {
                      const names = players.split(",").map((n) => n.trim()).filter(Boolean);
                      if (names.length > 0) {
                        onCompleteTile(team.id, names);
                      }
                    }
                  }}
                >
                  Complete Tile
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
