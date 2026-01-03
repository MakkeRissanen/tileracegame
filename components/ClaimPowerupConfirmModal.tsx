import { GameState, PowerupTile, Team } from "@/types/game";
import { Modal } from "@/components/ui";

interface ClaimPowerupConfirmModalProps {
  isOpen: boolean;
  tile: PowerupTile | null;
  team: Team;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ClaimPowerupConfirmModal({
  isOpen,
  tile,
  team,
  onClose,
  onConfirm,
}: ClaimPowerupConfirmModalProps) {
  if (!tile) return null;

  // For unlimited claim type, never show as "already claimed"
  const alreadyClaimed = tile.claimType === "unlimited" 
    ? false 
    : (team.claimedPowerupTiles || []).includes(tile.id);

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} isDark={true} maxWidth="max-w-md" title="Confirm completion">
      <div className="text-sm text-slate-700 dark:text-slate-300">
        <div className="space-y-2">
          <div>
            Task: <b>{tile.label}</b>
          </div>
          <div>
            Reward:{" "}
            <b>
              {tile.rewardPowerupId
                ? getPowerupLabel(tile.rewardPowerupId)
                : "No reward"}
            </b>
            {alreadyClaimed && (
              <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                (already claimed)
              </span>
            )}
          </div>

          {(tile.image || tile.instructions) && (
            <div className="mt-2 flex gap-3">
              {tile.image && (
                <div className="flex-shrink-0">
                  <img
                    src={tile.image}
                    alt={tile.label}
                    className="h-24 w-auto rounded-lg object-contain border border-slate-600"
                  />
                </div>
              )}
              {tile.instructions && (
                <div className="flex-1 rounded-lg border p-2 text-xs border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                  <div className="font-semibold mb-1 text-slate-800 dark:text-slate-200">
                    Instructions:
                  </div>
                  {tile.instructions}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={onConfirm}
          disabled={!tile.rewardPowerupId || alreadyClaimed}
          className="flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed bg-emerald-600 dark:bg-emerald-700 hover:bg-emerald-700 dark:hover:bg-emerald-600"
        >
          Select players
        </button>
        <button
          onClick={onClose}
          className="flex-1 rounded-xl border px-4 py-2 text-sm hover:opacity-80 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-600"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}
