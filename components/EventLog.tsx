"use client";

import { GameState } from "@/types/game";

interface EventLogProps {
  game: GameState;
  isDark: boolean;
}

export default function EventLog({ game, isDark }: EventLogProps) {
  return (
    <div className="space-y-4">
      <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
        Event Log
      </h2>
      
      <div
        className={`
          ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}
          border rounded-2xl shadow-sm p-4
          max-h-[720px] overflow-y-auto dark-scrollbar
        `}
      >
        <div className="space-y-2">
          {game.log && game.log.length > 0 ? (
            game.log.map((entry) => (
              <div
                key={entry.id}
                className={`
                  p-2 rounded-lg text-sm
                  ${isDark ? "bg-slate-700/50" : "bg-slate-50"}
                `}
              >
                <div className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"} mb-1`}>
                  {new Date(entry.ts).toLocaleTimeString()}
                </div>
                <div className={isDark ? "text-slate-200" : "text-slate-700"}>
                  {entry.message}
                </div>
              </div>
            ))
          ) : (
            <p className={`text-center text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              No events yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
