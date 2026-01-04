"use client";

import { useState } from "react";
import { useGameSync } from "@/hooks/useGameSync";
import GameHeader from "./GameHeader";
import MainGameLayout from "./MainGameLayout";

export default function SpectatorView() {
  // No authentication needed - spectator mode
  const { game, loading } = useGameSync("main", true);
  const [isDark] = useState(true);

  if (loading) {
    return (
      <div
        className={`min-h-screen ${
          isDark
            ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
            : "bg-gradient-to-br from-blue-50 via-white to-purple-50"
        } flex items-center justify-center`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className={isDark ? "text-slate-300" : "text-slate-600"}>
            Loading game...
          </p>
        </div>
      </div>
    );
  }

  // Empty dispatch - spectator cannot trigger actions
  const noOpDispatch = () => {};

  return (
    <div
      className={`min-h-screen ${
        isDark
          ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
          : "bg-gradient-to-br from-blue-50 via-white to-purple-50"
      }`}
    >
      <div className="container mx-auto p-2 sm:p-4 md:p-6 max-w-[1920px]">
        <GameHeader
          game={game}
          isDark={isDark}
          myTeam={null}
          isAdmin={false}
          isSpectator={true}
        />

        <MainGameLayout
          game={game}
          isDark={isDark}
          myTeam={null}
          isAdmin={false}
          onUsePowerup={() => {}}
          onOpenClaimPowerup={() => {}}
          onClearPools={() => {}}
          dispatch={noOpDispatch}
          adminBombVisibility={false}
          isSpectator={true}
        />
      </div>
    </div>
  );
}
