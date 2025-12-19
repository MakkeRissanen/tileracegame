"use client";

import { useState } from "react";
import { Button, Card, inputClass } from "./ui";
import { GameState, Team } from "@/types/game";

interface TeamSelectProps {
  game: GameState;
  isDark: boolean;
  onSelectTeam: (team: Team, password: string) => void;
}

export default function TeamSelect({ game, isDark, onSelectTeam }: TeamSelectProps) {
  const [teamName, setTeamName] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedTeamName = teamName.trim();
    const trimmedPassword = password.trim();
    
    if (!trimmedTeamName) {
      alert("Please enter a team name");
      return;
    }
    
    if (trimmedTeamName.length > 50) {
      alert("Team name is too long");
      return;
    }
    
    if (!trimmedPassword) {
      alert("Please enter a password");
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
      <h2 className={`text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-slate-900"}`}>
        Select Your Team
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
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
            required
          />
          {game.teams && game.teams.filter((t) => t.password).length > 0 && (
            <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Available teams: {game.teams.filter((t) => t.password).map((t) => t.name).join(", ")}
            </p>
          )}
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass(isDark)}
            placeholder="Enter team password"
            required
          />
        </div>

        <Button type="submit" variant="primary" isDark={isDark} className="w-full">
          Join Team
        </Button>
      </form>
    </Card>
  );
}
