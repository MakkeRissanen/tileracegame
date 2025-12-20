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
  myTeam: Team | null;
  isAdmin: boolean;
  onCompleteTile: (teamId: string, playerNames: string[]) => void;
  onUsePowerup: () => void;
  onClaimPowerup: (tileId: number) => void;
  onOpenClaimPowerup: (teamId: string) => void;
  onClearPools: () => void;
  onAdminUsePowerup?: (teamId: string) => void;
  onEditTeam?: (teamId: string) => void;
  onEditPowerupTile?: (tileId: number) => void;
  onEditPoolTask?: (taskId: string) => void;
}

export default function MainGameLayout({
  game,
  isDark,
  myTeam,
  isAdmin,
  onCompleteTile,
  onUsePowerup,
  onClaimPowerup,
  onOpenClaimPowerup,
  onClearPools,
  onAdminUsePowerup,
  onEditTeam,
  onEditPowerupTile,
  onEditPoolTask,
}: MainGameLayoutProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-3">
        {/* Left Sidebar - Teams */}
        <div>
          <TeamsSidebar
            game={game}
            isDark={isDark}
            myTeam={myTeam}
            isAdmin={isAdmin}
            onCompleteTile={onCompleteTile}
            onUsePowerup={onUsePowerup}
            onClaimPowerup={onClaimPowerup}
            onOpenClaimPowerup={onOpenClaimPowerup}
            onAdminUsePowerup={onAdminUsePowerup}
            onEditTeam={onEditTeam}
          />
        </div>

        {/* Right Side - Race Board with Player Points & Event Log beside it */}
        <div className="space-y-6">
          {/* Race Board with Player Points and Event Log */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px_260px] gap-4">
            <RaceBoard game={game} isDark={isDark} myTeam={myTeam} isAdmin={isAdmin} />
            <PlayerPointsPanel game={game} isDark={isDark} />
            <EventLog game={game} isDark={isDark} />
          </div>
          
          {/* Current Tile */}
          <GameBoard game={game} isDark={isDark} myTeam={myTeam} isAdmin={isAdmin} onCompleteTile={onCompleteTile} />
        </div>
      </div>

      {/* Powerup Tiles Board */}
      <PowerupTilesBoard
        game={game}
        isDark={isDark}
        myTeam={myTeam}
        isAdmin={isAdmin}
        onClaimPowerup={onClaimPowerup}
        onEditPowerupTile={onEditPowerupTile}
      />

      {/* Task Pools (Admin Only) */}
      {isAdmin && (
        <TaskPoolsSection
          game={game}
          isDark={isDark}
          onClearPools={onClearPools}
          onEditTask={onEditPoolTask}
        />
      )}
    </div>
  );
}
