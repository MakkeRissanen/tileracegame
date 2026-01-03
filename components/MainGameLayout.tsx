"use client";

import { GameState, Team } from "@/types/game";
import TeamsSidebar from "./TeamsSidebar";
import RaceBoard from "./RaceBoard";
import EventLog from "./EventLog";
import TaskPoolsSection from "./TaskPoolsSection";
import PlayerPointsPanel from "./PlayerPointsPanel";
import PowerupTilesBoard from "./PowerupTilesBoard";

interface MainGameLayoutProps {
  game: GameState;
  isDark: boolean;
  myTeam: Team | null;
  isAdmin: boolean;
  adminName?: string;
  onUsePowerup: () => void;
  onOpenClaimPowerup: (teamId: string) => void;
  onClearPools: () => void;
  onAdminUsePowerup?: (teamId: string) => void;
  onEditTeam?: (teamId: string) => void;
  onClearCooldown?: (teamId: string) => void;
  onAdminToggleCooldown?: (teamId: string, currentValue: number) => void;
  onEditPoolTask?: (taskId: string) => void;
  onClaimPowerupFromBoard?: (tileId: number) => void;
  onEditPowerupTile?: (tileId: number) => void;
  dispatch: (event: any) => void;
  adminBombVisibility: boolean;
}

export default function MainGameLayout({
  game,
  isDark,
  myTeam,
  isAdmin,
  adminName,
  onUsePowerup,
  onOpenClaimPowerup,
  onClearPools,
  onAdminUsePowerup,
  onEditTeam,
  onClearCooldown,
  onAdminToggleCooldown,
  onEditPoolTask,
  onClaimPowerupFromBoard,
  onEditPowerupTile,
  dispatch,
  adminBombVisibility,
}: MainGameLayoutProps) {
  return (
    <div className="space-y-3 md:space-y-6">
      {/* Mobile: Stack everything vertically, Desktop: Side by side layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-3">
        {/* Left Sidebar - Teams */}
        <div className="order-2 lg:order-1">
          <TeamsSidebar
            game={game}
            isDark={isDark}
            myTeam={myTeam}
            isAdmin={isAdmin}
            adminName={adminName}
            onUsePowerup={onUsePowerup}
            onOpenClaimPowerup={onOpenClaimPowerup}
            onAdminUsePowerup={onAdminUsePowerup}
            onEditTeam={onEditTeam}
            onClearCooldown={onClearCooldown}
            onAdminToggleCooldown={onAdminToggleCooldown}
            dispatch={dispatch}
            adminBombVisibility={adminBombVisibility}
          />
        </div>

        {/* Right Side - Race Board with Player Points & Event Log beside it */}
        <div className="space-y-3 md:space-y-6 order-1 lg:order-2">
          {/* Race Board with Player Points and Event Log */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_220px_260px] gap-3 md:gap-4">
            {/* Race Board - Always first on mobile */}
            <div className="order-1">
              <RaceBoard game={game} isDark={isDark} myTeam={myTeam} isAdmin={isAdmin} adminBombVisibility={adminBombVisibility} />
            </div>
            
            {/* Player Points - Second on mobile, middle on desktop */}
            <div className="order-2">
              <PlayerPointsPanel game={game} isDark={isDark} />
            </div>
            
            {/* Event Log - Third on mobile, right on desktop */}
            <div className="order-3">
              <EventLog game={game} isDark={isDark} isAdmin={isAdmin} adminBombVisibility={adminBombVisibility} />
            </div>
          </div>
        </div>
      </div>

      {/* Powerup Tiles Board (Admin Only) */}
      {isAdmin && (game.powerupTiles?.length || 0) > 0 && (
        <PowerupTilesBoard
          game={game}
          isDark={isDark}
          myTeam={myTeam}
          isAdmin={isAdmin}
          onClaimPowerup={onClaimPowerupFromBoard || (() => {})}
          onEditPowerupTile={onEditPowerupTile}
        />
      )}

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
