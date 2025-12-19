"use client";

import { useState } from "react";
import { GameState, PowerupTile, Team } from "@/types/game";
import { Button, Modal, inputClass } from "./ui";

interface ClaimPowerupModalProps {
  isOpen: boolean;
  onClose: () => void;
  tile: PowerupTile | null;
  team: Team;
  game: GameState;
  isDark: boolean;
  onClaim: (tileId: number, playerNames: string[]) => void;
}

export default function ClaimPowerupModal({
  isOpen,
  onClose,
  tile,
  team,
  game,
  isDark,
  onClaim,
}: ClaimPowerupModalProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");

  if (!tile) return null;

  const minRequired = tile.minCompletions || 1;
  const maxAllowed = tile.maxCompletions || 1;

  const handleAddPlayer = () => {
    const trimmed = newPlayerName.trim();
    if (trimmed && !selectedPlayers.includes(trimmed)) {
      if (selectedPlayers.length < maxAllowed) {
        setSelectedPlayers([...selectedPlayers, trimmed]);
        setNewPlayerName("");
      }
    }
  };

  const handleRemovePlayer = (index: number) => {
    setSelectedPlayers(selectedPlayers.filter((_, i) => i !== index));
  };

  const handleClaim = () => {
    if (selectedPlayers.length >= minRequired && selectedPlayers.length <= maxAllowed) {
      onClaim(tile.id, selectedPlayers);
      setSelectedPlayers([]);
      setNewPlayerName("");
      onClose();
    }
  };

  const canClaim = selectedPlayers.length >= minRequired && selectedPlayers.length <= maxAllowed;

  return (
    <Modal isOpen={isOpen} onClose={onClose} isDark={isDark}>
      <div className="space-y-4">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
            Claim Powerup Task
          </h2>
          <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            {team.name}
          </p>
        </div>

        {/* Tile Info */}
        <div
          className={`rounded-xl border p-4 ${
            isDark ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-slate-50"
          }`}
        >
          {tile.image && (
            <img
              src={tile.image}
              alt={tile.label}
              className="w-full h-32 object-cover rounded-lg mb-3"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}
          <h3 className={`font-semibold text-lg mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
            {tile.label}
          </h3>
          {tile.instructions && (
            <p className={`text-sm mb-3 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              {tile.instructions}
            </p>
          )}
          <div className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            <div>
              <span className="font-semibold">Reward:</span> {tile.rewardPowerupId}
            </div>
            <div>
              <span className="font-semibold">Points per player:</span> {tile.pointsPerCompletion}
            </div>
            <div>
              <span className="font-semibold">Required players:</span> {minRequired}-{maxAllowed}
            </div>
          </div>
        </div>

        {/* Player Selection */}
        <div>
          <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
            Select Players ({selectedPlayers.length}/{minRequired}-{maxAllowed})
          </label>

          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddPlayer()}
              placeholder="Enter player name"
              className={inputClass(isDark)}
            />
            <Button
              onClick={handleAddPlayer}
              variant="secondary"
              isDark={isDark}
              disabled={selectedPlayers.length >= maxAllowed}
            >
              Add
            </Button>
          </div>

          {selectedPlayers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedPlayers.map((name, idx) => (
                <div
                  key={idx}
                  className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 ${
                    isDark
                      ? "bg-slate-700 text-slate-100"
                      : "bg-slate-100 text-slate-900"
                  }`}
                >
                  {name}
                  <button
                    onClick={() => handleRemovePlayer(idx)}
                    className="hover:text-red-500 font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button onClick={onClose} variant="secondary" isDark={isDark} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleClaim}
            variant="primary"
            isDark={isDark}
            disabled={!canClaim}
            className="flex-1"
          >
            Claim Powerup ({selectedPlayers.length}/{minRequired}-{maxAllowed})
          </Button>
        </div>
      </div>
    </Modal>
  );
}
