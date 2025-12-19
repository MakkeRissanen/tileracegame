"use client";

import { GameState, Team } from "@/types/game";
import TeamsSidebar from "./TeamsSidebar";
import RaceBoard from "./RaceBoard";
import EventLog from "./EventLog";
import PowerupTilesBoard from "./PowerupTilesBoard";
import TaskPoolsSection from "./TaskPoolsSection";
import GameBoard from "./GameBoard";
import PlayerPointsPanel from "./PlayerPointsPanel";

interface MainGameLayoutProps {
  game: GameState;
  isDark: boolean;
  myTeam: Team;
  isAdmin: boolean;
  onCompleteTile: (teamId: string, playerNames: string[]) => void;
  onUsePowerup: () => void;
  onClaimPowerup: (tileId: number) => void;
  onClearPools: () => void;
}

export default function MainGameLayout({
  game,
  isDark,
  myTeam,
  isAdmin,
  onCompleteTile,
  onUsePowerup,
  onClaimPowerup,
  onClearPools,
}: MainGameLayoutProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Left Sidebar - Teams */}
        <div>
          <TeamsSidebar
            game={game}
            isDark={isDark}
            myTeam={myTeam}
            onCompleteTile={onCompleteTile}
            onUsePowerup={onUsePowerup}
          />
        </div>

        {/* Right Side - Race Board with Player Points & Event Log beside it */}
        <div className="space-y-6">
          {/* Race Board with Player Points and Event Log */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px_340px] gap-6">
            <RaceBoard game={game} isDark={isDark} myTeam={myTeam} />
            <PlayerPointsPanel game={game} isDark={isDark} />
            <EventLog game={game} isDark={isDark} />
          </div>
          
          {/* Current Tile */}
          <GameBoard game={game} isDark={isDark} myTeam={myTeam} onCompleteTile={onCompleteTile} />
        </div>
      </div>

      {/* Powerup Tiles Board */}
      <PowerupTilesBoard
        game={game}
        isDark={isDark}
        myTeam={myTeam}
        onClaimPowerup={onClaimPowerup}
      />

      {/* Task Pools (Admin Only) */}
      {isAdmin && (
        <TaskPoolsSection
          game={game}
          isDark={isDark}
          onClearPools={onClearPools}
        />
      )}
    </div>
  );
}
