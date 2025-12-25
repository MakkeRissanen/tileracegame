"use client";

import { useState, useEffect } from "react";
import { Team } from "@/types/game";

interface TeamSession {
  teamId: string;
  timestamp: number;
}

const SESSION_KEY = "tilerace_team_session";
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Hook for managing team session with localStorage (persistent across tabs/refreshes)
 * - Persists team login across page refreshes and browser restarts
 * - Automatically clears after 24 hours
 * - Shared across tabs for better UX
 */
export function useTeamSession(allTeams: Team[]) {
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  // Restore session on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const session: TeamSession = JSON.parse(stored);
        const now = Date.now();

        // Check if session is still valid
        if (now - session.timestamp < SESSION_TIMEOUT) {
          const team = allTeams.find((t) => t.id === session.teamId);
          if (team) {
            setMyTeam(team);
          } else {
            // Team no longer exists, clear session
            localStorage.removeItem(SESSION_KEY);
          }
        } else {
          // Session expired
          localStorage.removeItem(SESSION_KEY);
        }
      }
    } catch (err) {
      console.error("Failed to restore team session:", err);
      localStorage.removeItem(SESSION_KEY);
    }

    setIsRestoring(false);
  }, [allTeams]);

  // Save session when team changes
  const setTeam = (team: Team | null) => {
    setMyTeam(team);

    if (typeof window === "undefined") return;

    if (team) {
      const session: TeamSession = {
        teamId: team.id,
        timestamp: Date.now(),
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  };

  const logout = () => {
    setTeam(null);
  };

  return { myTeam, setTeam, logout, isRestoring };
}
