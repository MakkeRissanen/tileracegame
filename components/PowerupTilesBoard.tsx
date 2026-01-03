"use client";

import Image from "next/image";
import { GameState, Team, PowerupTile } from "@/types/game";
import { Button, Card } from "./ui";

interface PowerupTilesBoardProps {
  game: GameState;
  isDark: boolean;
  myTeam: Team | null;
  isAdmin?: boolean;
  onClaimPowerup: (tileId: number) => void;
  onEditPowerupTile?: (tileId: number) => void;
}

export default function PowerupTilesBoard({
  game,
  isDark,
  myTeam,
  isAdmin = false,
  onClaimPowerup,
  onEditPowerupTile,
}: PowerupTilesBoardProps) {
  const powerupTiles = game.powerupTiles || [];

  if (powerupTiles.length === 0) {
    return null;
  }

  const canClaim = (tile: PowerupTile): { allowed: boolean; reason?: string } => {
    if (!myTeam && !isAdmin) return { allowed: false, reason: "Not logged in" };
    
    // Admin can always claim
    if (isAdmin) return { allowed: true };

    const claimType = tile.claimType || "eachTeam";
    const tileId = Number(tile.id);

    // Unlimited claim type - always allowed
    if (claimType === "unlimited") {
      return { allowed: true };
    }

    if (claimType === "eachTeam") {
      const alreadyClaimed = (myTeam?.claimedPowerupTiles || []).includes(tileId);
      if (alreadyClaimed) return { allowed: false, reason: "Already claimed" };
    } else if (claimType === "firstTeam") {
      const anyTeamClaimed = game.teams?.some((t) =>
        (t.claimedPowerupTiles || []).includes(tileId)
      );
      if (anyTeamClaimed) return { allowed: false, reason: "Claimed by another team" };
    }

    return { allowed: true };
  };

  const getClaimTypeLabel = (claimType: string) => {
    if (claimType === "eachTeam") return "Each team once";
    if (claimType === "firstTeam") return "First team only";
    return "Unlimited";
  };

  return (
    <Card isDark={isDark} className="p-6">
      <h2 className={`text-2xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
        Powerup Tasks
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {powerupTiles.map((tile) => {
          const { allowed, reason } = canClaim(tile);
          const claimedByTeams = game.teams?.filter((t) =>
            (t.claimedPowerupTiles || []).includes(Number(tile.id))
          ) || [];

          return (
            <div
              key={tile.id}
              className={`rounded-xl border p-4 transition ${
                isDark
                  ? "border-slate-700 bg-slate-800/50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              {/* Image */}
              {tile.image && (
                <Image
                  src={tile.image}
                  alt={tile.label}
                  width={200}
                  height={80}
                  className="w-full h-20 object-contain rounded-lg mb-3"
                  unoptimized
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}

              {/* Label */}
              <h3
                className={`font-semibold text-lg mb-2 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {tile.label}
              </h3>

              {/* Instructions */}
              {tile.instructions && (
                <p
                  className={`text-sm mb-3 ${
                    isDark ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  {tile.instructions}
                </p>
              )}

              {/* Metadata */}
              <div
                className={`text-xs space-y-1 mb-3 ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                <div>
                  <span className="font-semibold">Reward:</span> {tile.rewardPowerupId}
                </div>
                <div>
                  <span className="font-semibold">Points:</span> {tile.pointsPerCompletion} per
                  completion
                </div>
                <div>
                  <span className="font-semibold">Players:</span> {tile.minCompletions}-
                  {tile.maxCompletions}
                </div>
                <div>
                  <span className="font-semibold">Claim Type:</span>{" "}
                  {getClaimTypeLabel(tile.claimType)}
                </div>
              </div>

              {/* Claimed by teams indicator */}
              {claimedByTeams.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1">
                  {claimedByTeams.map((team) => (
                    <span
                      key={team.id}
                      className={`px-2 py-1 rounded text-xs font-semibold text-white ${team.color}`}
                    >
                      {team.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Claim Button */}
              {isAdmin ? (
                <Button
                  onClick={() => onEditPowerupTile && onEditPowerupTile(tile.id)}
                  variant="secondary"
                  isDark={isDark}
                  className="w-full"
                >
                  ✏️ Edit Powerup Tile
                </Button>
              ) : (
                <Button
                  onClick={() => onClaimPowerup(tile.id)}
                  variant={allowed ? "primary" : "secondary"}
                  isDark={isDark}
                  disabled={!allowed}
                  className="w-full"
                >
                  {allowed ? "Claim" : reason || "Cannot Claim"}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
