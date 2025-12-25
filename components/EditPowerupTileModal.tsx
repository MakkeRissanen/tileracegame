"use client";

import { useState, useEffect } from "react";
import { PowerupTile, GameState } from "@/types/game";
import { Modal, Button, inputClass } from "./ui";

interface EditPowerupTileModalProps {
  isOpen: boolean;
  isDark: boolean;
  tile: PowerupTile;
  game: GameState;
  onClose: () => void;
  onUpdate: (tileId: number, updates: Partial<PowerupTile>, teamClaims?: { teamId: string; claimed: boolean }[]) => Promise<void>;
}

export default function EditPowerupTileModal({
  isOpen,
  isDark,
  tile,
  game,
  onClose,
  onUpdate,
}: EditPowerupTileModalProps) {
  const [label, setLabel] = useState(tile.label);
  const [instructions, setInstructions] = useState(tile.instructions);
  const [image, setImage] = useState(tile.image);
  const [rewardPowerupId, setRewardPowerupId] = useState(tile.rewardPowerupId);
  const [pointsPerCompletion, setPointsPerCompletion] = useState(tile.pointsPerCompletion);
  const [minCompletions, setMinCompletions] = useState(tile.minCompletions);
  const [maxCompletions, setMaxCompletions] = useState(tile.maxCompletions);
  const [claimType, setClaimType] = useState(tile.claimType);
  const [saving, setSaving] = useState(false);

  // Track which teams have claimed this tile
  const [teamClaims, setTeamClaims] = useState<Record<string, boolean>>(() => {
    const claims: Record<string, boolean> = {};
    game.teams?.forEach((team) => {
      claims[team.id] = (team.claimedPowerupTiles || []).includes(tile.id);
    });
    return claims;
  });

  // Sync state when modal opens or tile changes
  useEffect(() => {
    if (isOpen) {
      setLabel(tile.label);
      setInstructions(tile.instructions);
      setImage(tile.image);
      setRewardPowerupId(tile.rewardPowerupId);
      setPointsPerCompletion(tile.pointsPerCompletion);
      setMinCompletions(tile.minCompletions);
      setMaxCompletions(tile.maxCompletions);
      setClaimType(tile.claimType);
      
      const claims: Record<string, boolean> = {};
      game.teams?.forEach((team) => {
        claims[team.id] = (team.claimedPowerupTiles || []).includes(tile.id);
      });
      setTeamClaims(claims);
    }
  }, [isOpen, tile, game.teams]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Build array of team claim changes
      const claimChanges = Object.entries(teamClaims).map(([teamId, claimed]) => ({
        teamId,
        claimed,
      }));

      await onUpdate(tile.id, {
        label,
        instructions,
        image,
        rewardPowerupId,
        pointsPerCompletion,
        minCompletions,
        maxCompletions,
        claimType,
      }, claimChanges);
      onClose();
    } catch (err) {
      alert(`Failed to update: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isDark={isDark}>
      <div className="p-6">
        <h2 className={`text-2xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
          Edit Powerup Tile
        </h2>

        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className={inputClass(isDark)}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Instructions
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              className={inputClass(isDark)}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Image URL
            </label>
            <input
              type="text"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className={inputClass(isDark)}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Reward Powerup ID
            </label>
            <input
              type="text"
              value={rewardPowerupId}
              onChange={(e) => setRewardPowerupId(e.target.value)}
              className={inputClass(isDark)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                Points per Completion
              </label>
              <input
                type="number"
                value={pointsPerCompletion}
                onChange={(e) => setPointsPerCompletion(Number(e.target.value))}
                className={inputClass(isDark)}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                Claim Type
              </label>
              <select
                value={claimType}
                onChange={(e) => setClaimType(e.target.value as "eachTeam" | "firstTeam" | "unlimited")}
                className={inputClass(isDark)}
              >
                <option value="eachTeam">Each team once</option>
                <option value="firstTeam">First team only</option>
                <option value="unlimited">Unlimited</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                Min Completions
              </label>
              <input
                type="number"
                value={minCompletions}
                onChange={(e) => setMinCompletions(Number(e.target.value))}
                className={inputClass(isDark)}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                Max Completions
              </label>
              <input
                type="number"
                value={maxCompletions}
                onChange={(e) => setMaxCompletions(Number(e.target.value))}
                className={inputClass(isDark)}
              />
            </div>
          </div>
        </div>

        {/* Team Claims Section */}
        <div className="mt-6 pt-6 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}">
          <h3 className={`text-lg font-semibold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>
            Team Claims
          </h3>
          <p className={`text-sm mb-3 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Toggle which teams have already claimed this powerup tile
          </p>
          {game.teams && game.teams.length > 0 ? (
            <div className="space-y-2">
              {game.teams.map((team) => (
                <label
                  key={team.id}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-opacity-50 ${
                    isDark ? "hover:bg-slate-700" : "hover:bg-slate-100"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={teamClaims[team.id] || false}
                    onChange={(e) =>
                      setTeamClaims((prev) => ({ ...prev, [team.id]: e.target.checked }))
                    }
                    className="w-4 h-4 rounded"
                  />
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${team.color}`}
                  >
                    {team.name}
                  </span>
                  <span className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    {teamClaims[team.id] ? "Claimed" : "Not claimed"}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <p className={`text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              No teams available
            </p>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="secondary" isDark={isDark} onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button variant="primary" isDark={isDark} onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
