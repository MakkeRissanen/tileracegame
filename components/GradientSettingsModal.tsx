"use client";

import { useState } from "react";
import { Modal, Button } from "./ui";

interface GradientSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (config: { easy: number; medium: number; hard: number }, gradient: boolean, earlyWeights?: { easy: number; medium: number; hard: number }, lateWeights?: { easy: number; medium: number; hard: number }) => void;
  isDark: boolean;
}

export default function GradientSettingsModal({
  isOpen,
  onClose,
  onApply,
  isDark,
}: GradientSettingsModalProps) {
  const [useGradient, setUseGradient] = useState(false);
  
  // Overall weights (used when gradient is off)
  const [easyWeight, setEasyWeight] = useState(50);
  const [mediumWeight, setMediumWeight] = useState(35);
  const [hardWeight, setHardWeight] = useState(15);
  
  // Early game weights (first ~30% of tiles)
  const [earlyEasy, setEarlyEasy] = useState(70);
  const [earlyMedium, setEarlyMedium] = useState(25);
  const [earlyHard, setEarlyHard] = useState(5);
  
  // Late game weights (last ~30% of tiles)
  const [lateEasy, setLateEasy] = useState(20);
  const [lateMedium, setLateMedium] = useState(35);
  const [lateHard, setLateHard] = useState(45);

  const handleApply = () => {
    if (useGradient) {
      onApply(
        { easy: easyWeight, medium: mediumWeight, hard: hardWeight },
        true,
        { easy: earlyEasy, medium: earlyMedium, hard: earlyHard },
        { easy: lateEasy, medium: lateMedium, hard: lateHard }
      );
    } else {
      onApply(
        { easy: easyWeight, medium: mediumWeight, hard: hardWeight },
        false
      );
    }
    onClose();
  };

  const getTotalWeight = (e: number, m: number, h: number) => e + m + h;
  const getPercentage = (value: number, total: number) => Math.round((value / total) * 100);

  const overallTotal = getTotalWeight(easyWeight, mediumWeight, hardWeight);
  const earlyTotal = getTotalWeight(earlyEasy, earlyMedium, earlyHard);
  const lateTotal = getTotalWeight(lateEasy, lateMedium, lateHard);

  return (
    <Modal isOpen={isOpen} onClose={onClose} isDark={isDark}>
      <div className="space-y-6 max-w-2xl">
        <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
          🎲 Randomize Difficulties
        </h2>

        <div className={`p-4 rounded-lg ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
          <p className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            Configure how difficulty is distributed across the race board. Use gradient mode for progressive difficulty increase, or uniform mode for consistent distribution.
          </p>
        </div>

        {/* Gradient Toggle */}
        <div className={`p-4 rounded-lg border ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={useGradient}
              onChange={(e) => setUseGradient(e.target.checked)}
              className="w-5 h-5 rounded"
            />
            <span className={`ml-3 font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
              Enable Gradient Mode
            </span>
          </label>
          <p className={`text-xs mt-2 ml-8 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            When enabled, difficulty gradually increases from early game to late game
          </p>
        </div>

        {!useGradient ? (
          // Uniform Distribution
          <div className="space-y-4">
            <h3 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
              Difficulty Distribution
            </h3>
            
            <div className="space-y-3">
              {/* Easy */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className={`text-sm font-medium ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                    Easy
                  </label>
                  <span className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                    {getPercentage(easyWeight, overallTotal)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={easyWeight}
                  onChange={(e) => setEasyWeight(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Medium */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className={`text-sm font-medium ${isDark ? "text-amber-400" : "text-amber-600"}`}>
                    Medium
                  </label>
                  <span className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                    {getPercentage(mediumWeight, overallTotal)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={mediumWeight}
                  onChange={(e) => setMediumWeight(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Hard */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className={`text-sm font-medium ${isDark ? "text-purple-400" : "text-purple-600"}`}>
                    Hard
                  </label>
                  <span className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                    {getPercentage(hardWeight, overallTotal)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={hardWeight}
                  onChange={(e) => setHardWeight(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        ) : (
          // Gradient Distribution
          <div className="space-y-6">
            {/* Early Game */}
            <div className={`p-4 rounded-lg border ${isDark ? "border-emerald-700 bg-emerald-900/20" : "border-emerald-200 bg-emerald-50"}`}>
              <h3 className={`font-semibold mb-3 ${isDark ? "text-emerald-300" : "text-emerald-700"}`}>
                Early Game (~30% of tiles)
              </h3>
              
              <div className="space-y-3">
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
                    onChange={(e) => setEarlyEasy(parseInt(e.target.value))}
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
                    onChange={(e) => setEarlyMedium(parseInt(e.target.value))}
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
                    onChange={(e) => setEarlyHard(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Middle Game Info */}
            <div className={`p-3 rounded-lg text-center ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
              <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Middle game (~40% of tiles) will use blended weights
              </p>
            </div>

            {/* Late Game */}
            <div className={`p-4 rounded-lg border ${isDark ? "border-purple-700 bg-purple-900/20" : "border-purple-200 bg-purple-50"}`}>
              <h3 className={`font-semibold mb-3 ${isDark ? "text-purple-300" : "text-purple-700"}`}>
                Late Game (~30% of tiles)
              </h3>
              
              <div className="space-y-3">
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
                    onChange={(e) => setLateEasy(parseInt(e.target.value))}
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
                    onChange={(e) => setLateMedium(parseInt(e.target.value))}
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
                    onChange={(e) => setLateHard(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            variant="primary"
            isDark={isDark}
            onClick={handleApply}
          >
            Randomize Difficulties
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
