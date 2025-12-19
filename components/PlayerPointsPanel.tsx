"use client";

import { GameState } from "@/types/game";
import { Card } from "./ui";

interface PlayerPointsPanelProps {
  game: GameState;
  isDark: boolean;
}

export default function PlayerPointsPanel({ game, isDark }: PlayerPointsPanelProps) {
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
    <Card isDark={isDark} className="p-4">
      <h2 className={`text-lg font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
        Player Points
      </h2>

      {sortedPlayers.length === 0 ? (
        <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
          No players have earned points yet
        </p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {sortedPlayers.map(([playerName, points], idx) => {
            const teams = getPlayerTeams(playerName);
            const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "";

            return (
              <div
                key={playerName}
                className={`flex items-center justify-between p-2 rounded ${
                  idx < 3
                    ? isDark
                      ? "bg-yellow-900/20"
                      : "bg-yellow-50"
                    : isDark
                    ? "bg-slate-700/30"
                    : "bg-slate-50"
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {medal && <span className="text-lg">{medal}</span>}
                    <span
                      className={`font-medium ${
                        idx < 3
                          ? isDark
                            ? "text-yellow-200"
                            : "text-yellow-900"
                          : isDark
                          ? "text-slate-200"
                          : "text-slate-900"
                      }`}
                    >
                      {playerName}
                    </span>
                  </div>
                  {teams.length > 0 && (
                    <div className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      {teams.join(", ")}
                    </div>
                  )}
                </div>
                <div
                  className={`font-bold text-lg ${
                    idx < 3
                      ? isDark
                        ? "text-yellow-300"
                        : "text-yellow-600"
                      : isDark
                      ? "text-slate-300"
                      : "text-slate-700"
                  }`}
                >
                  {points}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
