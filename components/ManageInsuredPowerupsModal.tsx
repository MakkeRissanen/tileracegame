"use client";

import { useState, useEffect } from "react";
import { Modal, Button, inputClass } from "./ui";
import { Team, GameState, POWERUP_DEFS } from "@/types/game";

interface ManageInsuredPowerupsModalProps {
  isOpen: boolean;
  isDark: boolean;
  team: Team;
  game: GameState;
  onClose: () => void;
  onUpdateTeam: (teamId: string, updates: Partial<Team>) => void;
}

export default function ManageInsuredPowerupsModal({
  isOpen,
  isDark,
  team,
  game,
  onClose,
  onUpdateTeam,
}: ManageInsuredPowerupsModalProps) {
  const [insuredIndices, setInsuredIndices] = useState<number[]>(team.insuredPowerups || []);

  // Sync state with team prop whenever modal opens or team changes
  useEffect(() => {
    if (isOpen) {
      setInsuredIndices(team.insuredPowerups || []);
    }
  }, [isOpen, team]);

  const toggleInsurance = (index: number) => {
    if (insuredIndices.includes(index)) {
      setInsuredIndices(insuredIndices.filter((i) => i !== index));
    } else {
      setInsuredIndices([...insuredIndices, index]);
    }
  };

  const handleSave = () => {
    onUpdateTeam(team.id, { insuredPowerups: insuredIndices });
    onClose();
  };

  const getPowerupName = (powerupId: string): string => {
    const def = POWERUP_DEFS.find((p) => p.id === powerupId);
    return def?.name || powerupId;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isDark={isDark}>
      <div className="space-y-6 max-h-[80vh] overflow-y-auto">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
            Manage Insured Powerups
          </h2>
          <p className={`mt-2 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Select which powerups in <span className="font-semibold">{team.name}</span>'s inventory should be insured. 
            Insured powerups are protected from being stolen or disabled by other teams.
          </p>
        </div>

        {/* Powerup Inventory with Insurance Toggle */}
        <div>
          <label className={`block text-sm font-medium mb-3 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
            Powerup Inventory ({team.inventory.length} items)
          </label>

          {team.inventory.length > 0 ? (
            <div className="space-y-2">
              {team.inventory.map((powerupId, idx) => {
                const isInsured = insuredIndices.includes(idx);
                return (
                  <div
                    key={idx}
                    className={`
                      flex items-center justify-between p-3 rounded-lg border-2 transition-all
                      ${isInsured 
                        ? isDark 
                          ? "bg-emerald-900/20 border-emerald-500/50" 
                          : "bg-emerald-50 border-emerald-500/50"
                        : isDark 
                          ? "bg-slate-700 border-slate-600" 
                          : "bg-slate-100 border-slate-200"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-lg ${isInsured ? "text-emerald-500" : isDark ? "text-slate-400" : "text-slate-500"}`}>
                        {isInsured ? "🛡️" : "⚡"}
                      </span>
                      <div>
                        <div className={isDark ? "text-slate-200" : "text-slate-800"}>
                          {getPowerupName(powerupId)}
                        </div>
                        <div className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          Index: {idx}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleInsurance(idx)}
                      className={`
                        px-4 py-2 rounded-lg font-medium text-sm transition-colors
                        ${isInsured
                          ? isDark
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "bg-emerald-500 hover:bg-emerald-600 text-white"
                          : isDark
                            ? "bg-slate-600 hover:bg-slate-500 text-slate-200"
                            : "bg-slate-300 hover:bg-slate-400 text-slate-700"
                        }
                      `}
                    >
                      {isInsured ? "✓ Insured" : "Insure"}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={`text-center py-8 rounded-lg ${isDark ? "bg-slate-700/50" : "bg-slate-100"}`}>
              <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                This team has no powerups in their inventory
              </p>
            </div>
          )}
        </div>

        {/* Summary */}
        {team.inventory.length > 0 && (
          <div className={`p-4 rounded-lg ${isDark ? "bg-slate-700" : "bg-slate-100"}`}>
            <div className="flex items-center justify-between text-sm">
              <span className={isDark ? "text-slate-300" : "text-slate-600"}>
                Insured Powerups:
              </span>
              <span className={`font-semibold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                {insuredIndices.length} / {team.inventory.length}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSave}
            variant="primary"
            isDark={isDark}
            className="flex-1"
          >
            Save Changes
          </Button>
          <Button
            onClick={onClose}
            variant="secondary"
            isDark={isDark}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
