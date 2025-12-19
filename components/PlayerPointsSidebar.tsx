"use client";

import { GameState } from "@/types/game";
import { Button, Card } from "./ui";

interface PlayerPointsSidebarProps {
  game: GameState;
  isDark: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export default function PlayerPointsSidebar({
  game,
  isDark,
  isOpen,
  onClose,
}: PlayerPointsSidebarProps) {
  if (!isOpen) return null;

  const playerPoints = game.playerPoints || {};
  const sortedPlayers = Object.entries(playerPoints).sort(([, a], [, b]) => b - a);

  // Find which team each player belongs to
  const getPlayerTeams = (playerName: string): string[] => {
    const teams: string[] = [];
    game.teams?.forEach((team) => {
      if (team.members?.includes(playerName)) {
        teams.push(team.name);
      }
    });
    return teams;
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full w-80 shadow-2xl transform transition-transform duration-300 ease-in-out z-40 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      } ${isDark ? "bg-slate-800" : "bg-white"}`}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className={`p-4 border-b ${isDark ? "border-slate-700" : "border-slate-200"}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
              Player Points
            </h2>
            <Button onClick={onClose} variant="secondary" isDark={isDark} className="text-sm">
              Close
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {sortedPlayers.length === 0 ? (
            <p className={`text-center ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              No players have earned points yet
            </p>
          ) : (
            sortedPlayers.map(([playerName, points], index) => {
              const teams = getPlayerTeams(playerName);
              const isTop3 = index < 3;

              return (
                <div
                  key={playerName}
                  className={`p-3 rounded-lg ${
                    isTop3
                      ? isDark
                        ? "bg-amber-900/30 border border-amber-700"
                        : "bg-amber-50 border border-amber-300"
                      : isDark
                      ? "bg-slate-700/50"
                      : "bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isTop3 && (
                        <span className="text-lg">
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                        </span>
                      )}
                      <div>
                        <div
                          className={`font-semibold ${
                            isDark ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {playerName}
                        </div>
                        {teams.length > 0 && (
                          <div
                            className={`text-xs ${
                              isDark ? "text-slate-400" : "text-slate-600"
                            }`}
                          >
                            {teams.join(", ")}
                          </div>
                        )}
                      </div>
                    </div>
                    <div
                      className={`text-xl font-bold ${
                        isTop3
                          ? "text-amber-600"
                          : isDark
                          ? "text-slate-300"
                          : "text-slate-700"
                      }`}
                    >
                      {points}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
