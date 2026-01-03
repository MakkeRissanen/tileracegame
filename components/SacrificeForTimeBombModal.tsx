import { useState } from "react";
import { Team, POWERUP_DEFS } from "@/types/game";
import { Modal, Button } from "@/components/ui";

interface SacrificeForTimeBombModalProps {
  isOpen: boolean;
  team: Team;
  onClose: () => void;
  onConfirm: (powerupIndices: number[]) => void;
}

export default function SacrificeForTimeBombModal({
  isOpen,
  team,
  onClose,
  onConfirm,
}: SacrificeForTimeBombModalProps) {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  const handleToggle = (index: number) => {
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter((i) => i !== index));
    } else if (selectedIndices.length < 3) {
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  const handleConfirm = () => {
    if (selectedIndices.length === 3) {
      onConfirm(selectedIndices);
      setSelectedIndices([]);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedIndices([]);
    onClose();
  };

  const getPowerupName = (powerupId: string): string => {
    return POWERUP_DEFS.find((p) => p.id === powerupId)?.name || powerupId;
  };

  const getPowerupDescription = (powerupId: string): string => {
    return POWERUP_DEFS.find((p) => p.id === powerupId)?.description || "";
  };

  // Create a map of powerup counts
  const powerupCounts = new Map<string, number[]>();
  team.inventory.forEach((powerupId, index) => {
    if (!powerupCounts.has(powerupId)) {
      powerupCounts.set(powerupId, []);
    }
    powerupCounts.get(powerupId)!.push(index);
  });

  // Check if powerup is insured
  const isInsured = (index: number) => {
    return (team.insuredPowerups || []).includes(index);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      isDark={true}
      maxWidth="max-w-2xl"
      title="💣 Sacrifice for Time Bomb"
    >
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-orange-100 dark:bg-orange-950 border border-orange-300 dark:border-orange-700">
          <p className="text-sm text-orange-900 dark:text-orange-100">
            Select <strong>3 powerups</strong> from your inventory to sacrifice. You will receive a <strong>Time Bomb 🛡️</strong> in return.
          </p>
          <p className="text-xs text-orange-800 dark:text-orange-200 mt-2">
            Time Bomb: Mark your current tile with a time bomb. The next team to land on it gets pushed back 2 tiles.
          </p>
          <p className="text-xs text-green-800 dark:text-green-300 mt-2 font-semibold">
            🛡️ Time bombs are automatically insured and cannot be stolen or disabled!
          </p>
          <p className="text-xs text-blue-800 dark:text-blue-300 mt-2 font-semibold">
            🔒 Secret: Other teams won't see you claiming or using this powerup!
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Your Inventory ({team.inventory.length} powerups)
            </h3>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Selected: {selectedIndices.length}/3
            </span>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {Array.from(powerupCounts.entries()).map(([powerupId, indices]) => (
              <div key={powerupId} className="space-y-1">
                {indices.map((index) => {
                  const selected = selectedIndices.includes(index);
                  const insured = isInsured(index);
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleToggle(index)}
                      disabled={!selected && selectedIndices.length >= 3}
                      className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                        selected
                          ? "border-orange-500 bg-orange-50 dark:bg-orange-950"
                          : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600"
                      } ${
                        !selected && selectedIndices.length >= 3
                          ? "opacity-40 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900 dark:text-slate-100">
                              {getPowerupName(powerupId)}
                            </span>
                            {insured && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                🛡️ Insured
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            {getPowerupDescription(powerupId)}
                          </p>
                        </div>
                        <div className="ml-3">
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                              selected
                                ? "border-orange-500 bg-orange-500"
                                : "border-slate-300 dark:border-slate-600"
                            }`}
                          >
                            {selected && (
                              <svg
                                className="w-4 h-4 text-white"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path d="M5 13l4 4L19 7"></path>
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-300 dark:border-slate-700">
          <Button onClick={handleClose} variant="secondary" className="flex-1" isDark={true}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedIndices.length !== 3}
            className="flex-1 bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600"
            isDark={true}
          >
            Sacrifice & Get Time Bomb 💣
          </Button>
        </div>
      </div>
    </Modal>
  );
}
