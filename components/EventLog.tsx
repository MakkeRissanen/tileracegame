"use client";

import { GameState } from "@/types/game";

interface EventLogProps {
  game: GameState;
  isDark: boolean;
}

export default function EventLog({ game, isDark }: EventLogProps) {
  const renderEventLogEntry = (message: string) => {
    const teams = game.teams || [];
    const teamNames = teams.map((t) => t.name);

    // Check if this is an admin action (don't colorize team names)
    const isAdminAction = message.includes('👑') || message.includes('Admin') || message.includes('admin') || message.includes('set') && message.includes('tile');

    // Parse structured completion messages
    const completionMatch = message.match(/^(.+?),\s*(.+?)\s+completed\s+(.+?)\s+\((.+?)\)\s+→\s+Current:\s+(.+)$/);
    const completionMatchDoubled = message.match(/^(.+?),\s*(.+?)\s+completed\s+(doubled\s+)?Tile\s+(\d+):\s+"(.+?)"\s+\((.+?)\)\s+→\s+Current:\s+(.+?)(?:\s+🎁\s+Reward gained:\s+(.+))?$/);
    const winnerMatch = message.match(/^🏆🎉\s+(.+?)\s+completed\s+the\s+(?:doubled\s+)?Final Tile!\s+(.+?)\s+are the WINNERS!/);

    // Format completion message with multiple lines
    if (completionMatchDoubled) {
      const [, teamName, players, doubled, tileNum, tileLabel, pointsInfo, currentTile, reward] = completionMatchDoubled;
      const team = teams.find((t) => t.name === teamName);
      
      return (
        <div className={`rounded-lg p-2 text-xs leading-relaxed space-y-1 ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
          <div className="break-words">
            {team ? (
              <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${team.color} ${isDark ? 'text-slate-900' : 'text-slate-900'}`}>
                🏴{teamName}
              </span>
            ) : teamName}
          </div>
          <div className="pl-2 text-[11px] break-words">
            🏁 {players} completed {doubled ? 'doubled ' : ''}<strong>Tile {tileNum}:</strong>
          </div>
          <div className="pl-4 text-[11px] break-words">
            "{tileLabel}"
          </div>
          <div className="pl-2 text-[11px] break-words">
            ⭐ {pointsInfo}
          </div>
          <div className="pl-2 text-[11px] break-words">
            📍 Current: {currentTile}
          </div>
          {reward && (
            <div className="pl-2 text-[11px] break-words">
              🎁 Reward: {reward}
            </div>
          )}
        </div>
      );
    }

    // Winner message
    if (winnerMatch) {
      const [, teamName, players] = winnerMatch;
      const team = teams.find((t) => t.name === teamName);
      
      return (
        <div className={`rounded-lg p-3 text-xs leading-relaxed space-y-1 border-2 ${isDark ? 'bg-amber-900/20 border-amber-600 text-amber-100' : 'bg-amber-50 border-amber-400 text-amber-900'}`}>
          <div className="text-base font-bold">🏆🎉 WINNERS! 🎉🏆</div>
          <div className="break-words">
            {team ? (
              <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${team.color} ${isDark ? 'text-slate-900' : 'text-slate-900'}`}>
                🏴{teamName}
              </span>
            ) : teamName}
            {' completed the Final Tile!'}
          </div>
          <div className="pl-2 text-[11px] break-words">
            👥 {players}
          </div>
        </div>
      );
    }

    // Fast path: no teams yet, or admin action - just render text
    if (!teamNames.length || isAdminAction) {
      return <div className={`rounded-lg p-2 text-xs leading-relaxed ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>{message}</div>;
    }

    // Identify primary team color from first team mentioned
    let primaryColor = null;
    for (const tName of teamNames) {
      if (message.includes(tName)) {
        const team = teams.find((t) => t.name === tName);
        if (team && !primaryColor) {
          primaryColor = team.color;
          break;
        }
      }
    }

    // Build parts: plain text and team badges
    const parts: React.ReactNode[] = [];
    let lastIdx = 0;
    const regex = new RegExp(`(${teamNames.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");
    let match;
    
    while ((match = regex.exec(message)) !== null) {
      if (match.index > lastIdx) {
        parts.push(message.substring(lastIdx, match.index));
      }
      const tName = match[0];
      const team = teams.find((t) => t.name === tName);
      if (team) {
        parts.push(
          <span key={`badge-${match.index}`} className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${team.color} ${isDark ? 'text-slate-900' : 'text-slate-900'}`}>
            🏴{tName}
          </span>
        );
      } else {
        parts.push(tName);
      }
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < message.length) {
      parts.push(message.substring(lastIdx));
    }

    return (
      <div className={`rounded-lg p-2 text-xs leading-relaxed break-words ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
        {parts}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
        Event Log
      </h2>
      
      <div
        className={`
          ${isDark ? "bg-slate-900 border-slate-900" : "bg-slate-50 border-slate-200"}
          border rounded-xl p-3
          max-h-[720px] overflow-y-auto dark-scrollbar
        `}
      >
        <div className="space-y-2">
          {game.log && game.log.length > 0 ? (
            game.log.map((entry) => (
              <div key={entry.id}>
                <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {new Date(entry.ts).toLocaleString()} •{' '}
                </span>
                {renderEventLogEntry(entry.message)}
              </div>
            ))
          ) : (
            <div className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              No actions yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
