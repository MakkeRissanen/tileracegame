"use client";

import { useState } from "react";
import { Modal, Button } from "./ui";

interface GradientSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: { easy: number; medium: number; hard: number }, gradient: boolean, earlyWeights?: { easy: number; medium: number; hard: number }, lateWeights?: { easy: number; medium: number; hard: number }) => void;
  onApply: (config: { easy: number; medium: number; hard: number }, gradient: boolean, earlyWeights?: { easy: number; medium: number; hard: number }, lateWeights?: { easy: number; medium: number; hard: number }) => void;
  isDark: boolean;
}

export default function GradientSettingsModal({
  isOpen,
  onClose,
  onSave,
  onApply,
  isDark,
}: GradientSettingsModalProps) {
  // Early game weights (first ~30% of tiles) - sum should always be 100
  const [earlyEasy, setEarlyEasy] = useState(65);
  const [earlyMedium, setEarlyMedium] = useState(30);
  const [earlyHard, setEarlyHard] = useState(5);
  
  // Late game weights (last ~30% of tiles) - sum should always be 100
  const [lateEasy, setLateEasy] = useState(5);
  const [lateMedium, setLateMedium] = useState(40);
  const [lateHard, setLateHard] = useState(55);

  // Helper to adjust other values proportionally when one slider changes
  const adjustWeights = (changedValue: number, otherValue1: number, otherValue2: number) => {
    const remaining = 100 - changedValue;
    const total = otherValue1 + otherValue2;
    
    if (total === 0) {
      // If both others are 0, split remaining equally
      return [Math.floor(remaining / 2), Math.ceil(remaining / 2)];
    }
    
    // Distribute remaining proportionally
    const ratio1 = otherValue1 / total;
    const ratio2 = otherValue2 / total;
    
    return [
      Math.round(remaining * ratio1),
      Math.round(remaining * ratio2)
    ];
  };

  const handleEarlyEasyChange = (value: number) => {
    setEarlyEasy(value);
    const [newMedium, newHard] = adjustWeights(value, earlyMedium, earlyHard);
    setEarlyMedium(newMedium);
    setEarlyHard(newHard);
  };

  const handleEarlyMediumChange = (value: number) => {
    setEarlyMedium(value);
    const [newEasy, newHard] = adjustWeights(value, earlyEasy, earlyHard);
    setEarlyEasy(newEasy);
    setEarlyHard(newHard);
  };

  const handleEarlyHardChange = (value: number) => {
    setEarlyHard(value);
    const [newEasy, newMedium] = adjustWeights(value, earlyEasy, earlyMedium);
    setEarlyEasy(newEasy);
    setEarlyMedium(newMedium);
  };

  const handleLateEasyChange = (value: number) => {
    setLateEasy(value);
    const [newMedium, newHard] = adjustWeights(value, lateMedium, lateHard);
    setLateMedium(newMedium);
    setLateHard(newHard);
  };

  const handleLateMediumChange = (value: number) => {
    setLateMedium(value);
    const [newEasy, newHard] = adjustWeights(value, lateEasy, lateHard);
    setLateEasy(newEasy);
    setLateHard(newHard);
  };

  const handleLateHardChange = (value: number) => {
    setLateHard(value);
    const [newEasy, newMedium] = adjustWeights(value, lateEasy, lateMedium);
    setLateEasy(newEasy);
    setLateMedium(newMedium);
  };

  const handleSave = () => {
    onSave(
      { easy: 50, medium: 35, hard: 15 }, // Placeholder, not used in gradient mode
      true,
      { easy: earlyEasy, medium: earlyMedium, hard: earlyHard },
      { easy: lateEasy, medium: lateMedium, hard: lateHard }
    );
    onClose();
  };

  const handleApply = () => {
    onApply(
      { easy: 50, medium: 35, hard: 15 }, // Placeholder, not used in gradient mode
      true,
      { easy: earlyEasy, medium: earlyMedium, hard: earlyHard },
      { easy: lateEasy, medium: lateMedium, hard: lateHard }
    );
    // Don't close immediately - let the handler close it after confirmation
  };

  const getTotalWeight = (e: number, m: number, h: number) => e + m + h;
  const getPercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  const earlyTotal = getTotalWeight(earlyEasy, earlyMedium, earlyHard);
  const lateTotal = getTotalWeight(lateEasy, lateMedium, lateHard);

  return (
    <Modal isOpen={isOpen} onClose={onClose} isDark={isDark}>
      <div className="space-y-4 max-w-2xl">
        <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
          🎲 Randomize Difficulties
        </h2>

        <div className={`p-3 rounded-lg ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
          <p className={`text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            Configure how difficulty is distributed across the race board. Difficulty gradually increases from early game to late game.
          </p>
        </div>

        {/* Gradient Distribution */}
        <div className="space-y-4">
          {/* Early Game */}
          <div className={`p-3 rounded-lg border ${isDark ? "border-emerald-700 bg-emerald-900/20" : "border-emerald-200 bg-emerald-50"}`}>
              <h3 className={`font-semibold mb-2 text-sm ${isDark ? "text-emerald-300" : "text-emerald-700"}`}>
                Early Game (~30% of tiles)
              </h3>
              
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className={`text-sm font-medium ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                      Easy
                    </label>
                    <span className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                      {getPercentage(earlyEasy, earlyTotal)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={earlyEasy}
                    onChange={(e) => handleEarlyEasyChange(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className={`text-sm font-medium ${isDark ? "text-amber-400" : "text-amber-600"}`}>
                      Medium
                    </label>
                    <span className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                      {getPercentage(earlyMedium, earlyTotal)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={earlyMedium}
                    onChange={(e) => handleEarlyMediumChange(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className={`text-sm font-medium ${isDark ? "text-purple-400" : "text-purple-600"}`}>
                      Hard
                    </label>
                    <span className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                      {getPercentage(earlyHard, earlyTotal)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={earlyHard}
                    onChange={(e) => handleEarlyHardChange(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Middle Game Info */}
            <div className={`p-2 rounded text-center ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
              <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Middle game (~40%) uses blended weights
              </p>
            </div>

            {/* Late Game */}
            <div className={`p-3 rounded-lg border ${isDark ? "border-purple-700 bg-purple-900/20" : "border-purple-200 bg-purple-50"}`}>
              <h3 className={`font-semibold mb-2 text-sm ${isDark ? "text-purple-300" : "text-purple-700"}`}>
                Late Game (~30% of tiles)
              </h3>
              
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className={`text-sm font-medium ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                      Easy
                    </label>
                    <span className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                      {getPercentage(lateEasy, lateTotal)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={lateEasy}
                    onChange={(e) => handleLateEasyChange(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className={`text-sm font-medium ${isDark ? "text-amber-400" : "text-amber-600"}`}>
                      Medium
                    </label>
                    <span className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                      {getPercentage(lateMedium, lateTotal)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={lateMedium}
                    onChange={(e) => handleLateMediumChange(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className={`text-sm font-medium ${isDark ? "text-purple-400" : "text-purple-600"}`}>
                      Hard
                    </label>
                    <span className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                      {getPercentage(lateHard, lateTotal)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={lateHard}
                    onChange={(e) => handleLateHardChange(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="primary"
            isDark={isDark}
            onClick={handleSave}
            className="flex-1"
          >
            💾 Save Settings
          </Button>
          <Button
            variant="primary"
            isDark={isDark}
            onClick={handleApply}
            className="flex-1"
          >
            🎲 Apply & Randomize
          </Button>
          <Button
            variant="secondary"
            isDark={isDark}
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
