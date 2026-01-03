import { useState } from "react";
import { GameState, PowerupTile, Team, POWERUP_DEFS } from "@/types/game";
import { Modal } from "@/components/ui";
import PowerupTileDetailModal from "./PowerupTileDetailModal";

interface ClaimPowerupModalProps {
  isOpen: boolean;
  team: Team;
  game: GameState;
  onClose: () => void;
  onSelectTile: (tileId: number) => void;
  onSacrificeForTimeBomb?: () => void;
}

export default function ClaimPowerupModal({
  isOpen,
  team,
  game,
  onClose,
  onSelectTile,
  onSacrificeForTimeBomb,
}: ClaimPowerupModalProps) {
  const [detailTile, setDetailTile] = useState<PowerupTile | null>(null);
  const [showPowerupDescription, setShowPowerupDescription] = useState<string | null>(null);

  // Early return if team is undefined
  if (!team) {
    return null;
  }

  // Get powerup label by ID
  const getPowerupLabel = (powerupId: string): string => {
    const powerups = {
      "skip-1": "Skip 1 tile",
      "skip-2": "Skip 2 tiles",
      "skip-3": "Skip 3 tiles",
      "double-points": "Double Points",
      "block-team": "Block Team",
      "steal-powerup": "Steal Powerup",
      "reveal-tile": "Reveal Tile",
    };
    return powerups[powerupId as keyof typeof powerups] || powerupId;
  };

  // Determine claimable tiles for this team
  const getClaimableTiles = (team: Team): (PowerupTile & { claimed: boolean; claimedByTeam: string | null; disabled: boolean })[] => {
    return (game.powerupTiles || []).map((tile) => {
      const claimed = (team.claimedPowerupTiles || []).includes(tile.id);
      let claimedByTeam = null;
      let disabled = false;

      if (tile.claimType === "firstTeam") {
        // Check if any team has claimed this
        const claimingTeam = game.teams.find((t) =>
          (t.claimedPowerupTiles || []).includes(tile.id)
        );
        if (claimingTeam) {
          claimedByTeam = claimingTeam.name;
          disabled = true; // First team only - once claimed by anyone, disable for everyone
        }
      } else if (tile.claimType === "eachTeam") {
        disabled = claimed;
      } else if (tile.claimType === "unlimited") {
        // Unlimited = never disabled, never show as claimed
        disabled = false;
      }

      // Also disable if no reward
      if (!tile.rewardPowerupId) {
        disabled = true;
      }

      return { ...tile, claimed: tile.claimType === "unlimited" ? false : claimed, claimedByTeam, disabled };
    });
  };

  const claimableTiles = getClaimableTiles(team);

  const canSacrifice = (team.inventory?.length || 0) >= 3;
  
  // Check if any team has reached tile 5
  const hasTeamReachedTile5 = game.teams.some(t => t.pos >= 5);

  return (
    <Modal isOpen={isOpen} onClose={onClose} isDark={true} maxWidth="max-w-3xl" title="Claim powerup">
      {/* Notice if powerups not yet available */}
      {!hasTeamReachedTile5 && (
        <div className="mb-4 p-4 rounded-xl bg-yellow-50 dark:bg-yellow-950 border border-yellow-300 dark:border-yellow-700">
          <p className="text-sm text-yellow-900 dark:text-yellow-100 flex items-center gap-2">
            <span className="text-xl">🔒</span>
            <span>
              <strong>Powerup claiming is currently disabled.</strong> At least one team must complete tile 4 (reach tile 5) before any powerups can be claimed.
            </span>
          </p>
        </div>
      )}
      {/* Sacrifice for Time Bomb Button */}
      {onSacrificeForTimeBomb && (
        <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-950 dark:to-red-950 border border-orange-300 dark:border-orange-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-orange-900 dark:text-orange-100 flex items-center gap-2">
                💣 Sacrifice for Time Bomb
              </h3>
              <p className="text-xs text-orange-800 dark:text-orange-200 mt-1">
                Trade 3 of your powerups to obtain a Time Bomb
              </p>
            </div>
            <button
              disabled={!canSacrifice}
              onClick={onSacrificeForTimeBomb}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600 disabled:cursor-not-allowed transition-colors"
            >
              {canSacrifice ? 'Sacrifice 3 Powerups' : 'Need 3+ Powerups'}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-auto rounded-xl border border-slate-300 dark:border-slate-700">
        <table className="w-full text-left text-sm text-slate-900 dark:text-slate-200">
          <thead className="text-xs bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300">
            <tr>
              <th className="p-3">Image</th>
              <th className="p-3">Task</th>
              <th className="p-3">Reward</th>
              <th className="p-3">Claim Type</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {claimableTiles.map((tile) => (
              <tr
                key={tile.id}
                className="border-t border-slate-300 dark:border-slate-700"
              >
                <td className="p-3">
                  {tile.image ? (
                    <img
                      src={tile.image}
                      alt={tile.label}
                      className="h-12 w-12 rounded-md object-contain"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-md flex items-center justify-center bg-slate-200 dark:bg-slate-700">
                      <span className="text-xs text-slate-500">-</span>
                    </div>
                  )}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => setDetailTile(tile)}
                    className="font-medium text-left hover:underline text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    {tile.label}
                  </button>
                </td>
                <td className="p-3 text-slate-700 dark:text-slate-300">
                  {tile.rewardPowerupId ? (
                    <button
                      onClick={() => setShowPowerupDescription(tile.rewardPowerupId)}
                      className="text-left hover:underline text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      {getPowerupLabel(tile.rewardPowerupId)}
                    </button>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500">
                      No reward
                    </span>
                  )}
                </td>
                <td className="p-3 text-xs text-slate-600 dark:text-slate-400">
                  {tile.claimType === "eachTeam"
                    ? "Each Team"
                    : tile.claimType === "firstTeam"
                    ? "First Team"
                    : "Unlimited"}
                </td>
                <td className="p-3">
                  {!hasTeamReachedTile5 ? (
                    <span className="rounded-full px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-200">
                      🔒 Unavailable
                    </span>
                  ) : tile.claimed ? (
                    <span className="rounded-full px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                      Claimed
                    </span>
                  ) : tile.claimedByTeam ? (
                    <span className="rounded-full px-2 py-1 text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {tile.claimedByTeam}
                    </span>
                  ) : tile.disabled && tile.rewardPowerupId ? (
                    <span className="rounded-full px-2 py-1 text-xs bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-200">
                      Unavailable
                    </span>
                  ) : tile.rewardPowerupId ? (
                    <span className="rounded-full px-2 py-1 text-xs bg-emerald-50 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                      Available
                    </span>
                  ) : (
                    <span className="rounded-full px-2 py-1 text-xs bg-amber-50 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                      Needs reward
                    </span>
                  )}
                </td>
                <td className="p-3 text-right">
                  <button
                    disabled={!hasTeamReachedTile5 || tile.disabled}
                    onClick={() => onSelectTile(tile.id)}
                    className="rounded-xl px-3 py-2 text-xs font-semibold text-white disabled:opacity-40 bg-slate-800 dark:bg-slate-900 hover:bg-slate-700 dark:hover:bg-slate-800 disabled:cursor-not-allowed"
                  >
                    Select
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      <PowerupTileDetailModal
        isOpen={detailTile !== null}
        tile={detailTile}
        onClose={() => setDetailTile(null)}
      />

      {/* Powerup Description Modal */}
      {showPowerupDescription && (
        <Modal
          isOpen={true}
          onClose={() => setShowPowerupDescription(null)}
          isDark={true}
          maxWidth="max-w-md"
          title={POWERUP_DEFS.find((p) => p.id === showPowerupDescription)?.name || "Powerup Info"}
        >
          <div className="space-y-3">
            <p className="text-slate-700 dark:text-slate-300">
              {POWERUP_DEFS.find((p) => p.id === showPowerupDescription)?.description || "No description available."}
            </p>
          </div>
        </Modal>
      )}
    </Modal>
  );
}
