"use client";

import { GameState } from "@/types/game";
import { Card } from "./ui";

interface PlayerPointsPanelProps {
  game: GameState;
  isDark: boolean;
}

export default function PlayerPointsPanel({ game, isDark }: PlayerPointsPanelProps) {
  // Collect all player points from all teams
  const allPlayerPoints: Record<string, number> = {};
  
  game.teams?.forEach((team) => {
    if (team.playerPoints) {
      Object.keys(team.playerPoints).forEach((player) => {
        allPlayerPoints[player] = (allPlayerPoints[player] || 0) + team.playerPoints[player];
      });
    }
  });
  
  const sortedPlayers = Object.entries(allPlayerPoints).sort(([, a], [, b]) => b - a);

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
    <div className="max-w-[220px]">
      <h2 className={`text-lg font-bold mb-4 text-center ${isDark ? "text-white" : "text-slate-900"}`}>
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
                  isDark
                    ? "bg-slate-700/30"
                    : "bg-slate-50"
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {medal && <span className="text-lg">{medal}</span>}
                    <div>
                      <div
                        className={`font-medium ${
                          isDark
                            ? "text-slate-200"
                            : "text-slate-900"
                        }`}
                      >
                        {playerName}
                      </div>
                      {teams.length > 0 && (
                        <div className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                          {teams.join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div
                  className={`font-bold text-lg ${
                    isDark
                      ? "text-slate-300"
                      : "text-slate-700"
                  }`}
                >
                  {points.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
