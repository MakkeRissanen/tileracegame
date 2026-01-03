"use client";

import { GameState, Team } from "@/types/game";
import TeamsSidebar from "./TeamsSidebar";
import RaceBoard from "./RaceBoard";
import EventLog from "./EventLog";
import TaskPoolsSection from "./TaskPoolsSection";
import PlayerPointsPanel from "./PlayerPointsPanel";

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
  dispatch,
  adminBombVisibility,
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
        <div className="space-y-6">
          {/* Race Board with Player Points and Event Log */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px_260px] gap-4">
            <RaceBoard game={game} isDark={isDark} myTeam={myTeam} isAdmin={isAdmin} adminBombVisibility={adminBombVisibility} />
            <PlayerPointsPanel game={game} isDark={isDark} />
            <EventLog game={game} isDark={isDark} isAdmin={isAdmin} adminBombVisibility={adminBombVisibility} />
          </div>
        </div>
      </div>

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
