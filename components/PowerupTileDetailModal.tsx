import { PowerupTile } from "@/types/game";
import { Modal } from "@/components/ui";

interface PowerupTileDetailModalProps {
  isOpen: boolean;
  tile: PowerupTile | null;
  onClose: () => void;
}

export default function PowerupTileDetailModal({
  isOpen,
  tile,
  onClose,
}: PowerupTileDetailModalProps) {
  if (!tile) return null;

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
    <Modal isOpen={isOpen} onClose={onClose} isDark={true} maxWidth="max-w-3xl">
      <div className="flex gap-4 items-center -mt-4">
        {tile.image && (
          <div className="flex-shrink-0">
            <img
              src={tile.image}
              alt={`Image for ${tile.label}`}
              className="h-40 w-auto rounded-md object-contain"
            />
          </div>
        )}

        <div className="flex-1">
          <div className="text-xl text-slate-700 dark:text-slate-300">
            <span className="font-semibold">Task:</span> {tile.label}
          </div>
          <div className="mt-2 text-xl">
            <span className="font-semibold">Reward:</span>{" "}
            {tile.rewardPowerupId ? (
              <span className="rounded-full px-2 py-1 text-sm text-white bg-slate-800 dark:bg-slate-900">
                {getPowerupLabel(tile.rewardPowerupId)}
              </span>
            ) : (
              <span className="text-slate-400 dark:text-slate-500">None</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border p-4 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Instructions</div>
        <div className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
          {tile.instructions ? (
            tile.instructions
          ) : (
            <span className="text-slate-500">No instructions added yet.</span>
          )}
        </div>
        <div className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-400">
          <div>
            Points awarded: <span className="font-semibold">{tile.pointsPerCompletion || 1}</span> per
            completion
          </div>
          <div>
            Can be completed:{" "}
            <span className="font-semibold">{tile.maxCompletions || 1}</span>{" "}
            {(tile.maxCompletions || 1) === 1 ? "time" : "times"} total
          </div>
          <div>
            Minimum completions: <span className="font-semibold">{tile.minCompletions || 1}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
