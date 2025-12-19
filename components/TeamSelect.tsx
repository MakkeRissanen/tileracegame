"use client";

import { useState } from "react";
import { Button, Card, inputClass } from "./ui";
import { GameState, Team } from "@/types/game";

interface TeamSelectProps {
  game: GameState;
  isDark: boolean;
  onSelectTeam: (team: Team, password: string) => void;
  onAdminLogin: (password: string) => void;
}

export default function TeamSelect({ game, isDark, onSelectTeam, onAdminLogin }: TeamSelectProps) {
  const [teamName, setTeamName] = useState("");
  const [password, setPassword] = useState("");
  const [isAdminMode, setIsAdminMode] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedPassword = password.trim();
    
    if (!trimmedPassword) {
      alert("Please enter a password");
      return;
    }
    
    // Admin login mode
    if (isAdminMode) {
      onAdminLogin(trimmedPassword);
      return;
    }
    
    // Team login mode
    const trimmedTeamName = teamName.trim();
    
    if (!trimmedTeamName) {
      alert("Please enter a team name");
      return;
    }
    
    if (trimmedTeamName.length > 50) {
      alert("Team name is too long");
      return;
    }
    
    const team = game.teams?.find(
      (t) => t.name.toLowerCase() === trimmedTeamName.toLowerCase()
    );
    
    if (team) {
      onSelectTeam(team, trimmedPassword);
    } else {
      alert("Team not found. Please check the team name.");
    }
  };

  return (
    <Card isDark={isDark} className="p-8 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
          {isAdminMode ? "Admin Login" : "Select Your Team"}
        </h2>
        <button
          type="button"
          onClick={() => {
            setIsAdminMode(!isAdminMode);
            setTeamName("");
            setPassword("");
          }}
          className={`text-sm underline ${isDark ? "text-slate-400 hover:text-slate-300" : "text-slate-600 hover:text-slate-700"}`}
        >
          {isAdminMode ? "Switch to Team Login" : "Admin Login"}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isAdminMode && (
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Team Name
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className={inputClass(isDark)}
              placeholder="Enter your team name"
              required={!isAdminMode}
            />
            {game.teams && game.teams.filter((t) => t.password).length > 0 && (
              <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Available teams: {game.teams.filter((t) => t.password).map((t) => t.name).join(", ")}
              </p>
            )}
          </div>
        )}

        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
            {isAdminMode ? "Admin Password" : "Password"}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass(isDark)}
            placeholder={isAdminMode ? "Enter admin password" : "Enter team password"}
            required
          />
        </div>

        <Button type="submit" variant="primary" isDark={isDark} className="w-full">
          {isAdminMode ? "🔑 Login as Admin" : "Join Team"}
        </Button>
      </form>
    </Card>
  );
}
