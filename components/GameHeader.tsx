"use client";

import { Button } from "./ui";
import { Team } from "@/types/game";

interface GameHeaderProps {
  isDark: boolean;
  myTeam: Team | null;
  isAdmin: boolean;
  showAdminOptions: boolean;
  onShowAdminLogin: () => void;
  onToggleAdminOptions: () => void;
  onAdminLogout: () => void;
  onLogout: () => void;
  onShowRulebook: () => void;
  children?: React.ReactNode; // For admin options dropdown
}

export default function GameHeader({
  isDark,
  myTeam,
  isAdmin,
  showAdminOptions,
  onShowAdminLogin,
  onToggleAdminOptions,
  onAdminLogout,
  onLogout,
  onShowRulebook,
  children,
}: GameHeaderProps) {
  return (
    <header className="mb-8 flex justify-between items-start">
      <div>
        <h1 className={`text-4xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
          Tile Race Game
        </h1>
        <p className={`mt-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
          Real-time multiplayer tile racing competition
        </p>
      </div>
      <div className="flex items-center gap-3">
        {/* Rulebook Button - Always visible */}
        <Button
          onClick={onShowRulebook}
          variant="secondary"
          isDark={isDark}
        >
          📖 Rules
        </Button>

        {/* Admin Options */}
        {isAdmin && (
          <>
            <div className="relative">
              <Button
                onClick={onToggleAdminOptions}
                variant="secondary"
                isDark={isDark}
              >
                ⚙️ Options
              </Button>
              {showAdminOptions && children}
            </div>
            <Button
              onClick={onAdminLogout}
              variant="secondary"
              isDark={isDark}
            >
              Logout
            </Button>
          </>
        )}
        
        {myTeam && (
          <>
            <div className="text-right">
              <div className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Logged in as
              </div>
              <div className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                {myTeam.name}
              </div>
            </div>
            <Button onClick={onLogout} variant="secondary" isDark={isDark}>
              Logout
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
