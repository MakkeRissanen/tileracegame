import { useState } from "react";
import { PowerupTile, Team } from "@/types/game";
import { Modal } from "@/components/ui";

interface PowerupClaimPlayerPickerModalProps {
  isOpen: boolean;
  tile: PowerupTile | null;
  team: Team;
  onClose: () => void;
  onConfirm: (playerNames: string[]) => void;
}

export default function PowerupClaimPlayerPickerModal({
  isOpen,
  tile,
  team,
  onClose,
  onConfirm,
}: PowerupClaimPlayerPickerModalProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

  if (!tile || !team) return null;

  const allPlayers = [
    team.captain,
    ...(team.members || []).filter((m) => m !== team.captain),
  ].filter(Boolean);

  const maxCompletions = tile.maxCompletions || 1;
  const minCompletions = tile.minCompletions || 1;
  const pointsPerCompletion = tile.pointsPerCompletion || 1;
  const claimType = tile.claimType || "eachTeam";

  const claimTypeLabels = {
    eachTeam: "Once per team",
    firstTeam: "First team only",
    unlimited: "Unlimited claims",
  };

  const handlePlayerToggle = (playerName: string) => {
    if (maxCompletions === 1) {
      // Radio behavior
      setSelectedPlayers([playerName]);
    }
  };

  const handlePlayerIncrement = (playerName: string) => {
    if (selectedPlayers.length < maxCompletions) {
      setSelectedPlayers([...selectedPlayers, playerName]);
    }
  };

  const handlePlayerDecrement = (playerName: string) => {
    const idx = selectedPlayers.indexOf(playerName);
    if (idx !== -1) {
      setSelectedPlayers([
        ...selectedPlayers.slice(0, idx),
        ...selectedPlayers.slice(idx + 1),
      ]);
    }
  };

  const getPlayerCount = (playerName: string) => {
    return selectedPlayers.filter((p) => p === playerName).length;
  };

  const handleConfirm = () => {
    if (
      selectedPlayers.length >= minCompletions &&
      selectedPlayers.length <= maxCompletions
    ) {
      onConfirm(selectedPlayers);
      setSelectedPlayers([]);
    }
  };

  const canConfirm =
    selectedPlayers.length >= minCompletions &&
    selectedPlayers.length <= maxCompletions;

  return (
    <Modal isOpen={isOpen} onClose={onClose} isDark={true} maxWidth="max-w-md" title="Who completed this?">
      <div className="flex-1">
        <div className="text-sm text-slate-600 dark:text-slate-300">
            Task: <b>{tile.label}</b>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {pointsPerCompletion} points per completion
          </div>
          <div className="mt-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
            Claim type: {claimTypeLabels[claimType as keyof typeof claimTypeLabels]}
          </div>
          {tile.instructions && (
            <div className="mt-2 rounded-lg border p-2 text-xs border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
              <div className="font-semibold mb-1 text-slate-800 dark:text-slate-200">
                Instructions:
              </div>
              {tile.instructions}
            </div>
          )}
        </div>

        <div className="mt-4 space-y-3">
        {maxCompletions === 1 ? (
          <div>
            <label className="text-xs font-semibold mb-2 block text-slate-600 dark:text-slate-300">
              Select player
            </label>
            <div className="space-y-2">
              {allPlayers.map((playerName, idx) => (
                <label key={idx} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="powerupClaimPlayer"
                    checked={selectedPlayers.includes(playerName)}
                    onChange={() => handlePlayerToggle(playerName)}
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-900 dark:text-slate-200">
                    {playerName}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Select completors
              </label>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Min: {minCompletions}, Max: {maxCompletions}
              </div>
            </div>
            <div className="space-y-2">
              {allPlayers.map((playerName, idx) => {
                const count = getPlayerCount(playerName);
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  >
                    <span className="text-sm text-slate-900 dark:text-slate-200">
                      {playerName}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePlayerDecrement(playerName)}
                        disabled={count === 0}
                        className={`rounded px-2 py-1 text-sm font-bold ${
                          count > 0
                            ? "bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                        }`}
                      >
                        -
                      </button>
                      <span className="text-sm font-semibold w-6 text-center text-slate-900 dark:text-slate-100">
                        {count}
                      </span>
                      <button
                        onClick={() => handlePlayerIncrement(playerName)}
                        disabled={selectedPlayers.length >= maxCompletions}
                        className={`rounded px-2 py-1 text-sm font-bold ${
                          selectedPlayers.length < maxCompletions
                            ? "bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                        }`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-white bg-emerald-600 dark:bg-emerald-700 hover:bg-emerald-700 dark:hover:bg-emerald-600 ${
              !canConfirm ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Confirm {selectedPlayers.length > 0 ? `(${selectedPlayers.length})` : ""}
          </button>

          <button
            onClick={() => {
              setSelectedPlayers([]);
              onClose();
            }}
            className="flex-1 rounded-lg border px-3 py-2 text-sm hover:opacity-80 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
