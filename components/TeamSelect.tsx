"use client";

import { useState } from "react";
import { Button, Card, inputClass } from "./ui";
import { Team } from "@/types/game";

interface TeamSelectProps {
  isDark: boolean;
  onSelectTeam: (team: Team, password: string) => void;
  onAdminLogin: (adminName: string, password: string) => void;
  isLoading?: boolean;
}

export default function TeamSelect({ isDark, onSelectTeam, onAdminLogin, isLoading }: TeamSelectProps) {
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
      const trimmedAdminName = teamName.trim();
      
      if (!trimmedAdminName) {
        alert("Please enter an admin name");
        return;
      }
      
      onAdminLogin(trimmedAdminName, trimmedPassword);
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
    
    // Create a temporary team object for authentication
    // The actual team data will be loaded after authentication
    const tempTeam: Team = {
      id: "",
      name: trimmedTeamName,
      pos: 0,
      color: "",
      password: "",
      createdAt: 0,
      inventory: [],
      preCleared: [],
      copyChoice: [],
      claimedRaceTileRewards: [],
      claimedPowerupTiles: [],
      members: [],
      captain: "",
      playerPoints: {},
      powerupCooldown: false,
    };
    
    onSelectTeam(tempTeam, trimmedPassword);
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
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
            {isAdminMode ? "Admin Name" : "Team Name"}
          </label>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className={inputClass(isDark)}
            placeholder={isAdminMode ? "Enter admin name" : "Enter your team name"}
            required
          />
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
            placeholder={isAdminMode ? "Enter admin password" : "Enter team password"}
            required
          />
        </div>

        <Button type="submit" variant="primary" isDark={isDark} className="w-full" disabled={isLoading}>
          {isLoading ? "Authenticating..." : isAdminMode ? "🔑 Login as Admin" : "Join Team"}
        </Button>
      </form>
    </Card>
  );
}
