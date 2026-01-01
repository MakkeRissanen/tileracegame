"use client";

import { useState } from "react";
import { Modal, Button } from "./ui";

interface PowerupData {
  powerupType: string;
  label: string;
  pointsPerCompletion: number;
  maxCompletions: number;
  minCompletions: number;
  claimType: "eachTeam" | "firstTeam" | "unlimited";
  instructions: string;
  image: string;
}

interface ImportPowerupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (powerups: PowerupData[]) => void;
  isDark: boolean;
}

export default function ImportPowerupsModal({
  isOpen,
  onClose,
  onImport,
  isDark,
}: ImportPowerupsModalProps) {
  const [rawInput, setRawInput] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PowerupData[] | null>(null);

  const handleParse = () => {
    setParseError(null);
    setPreview(null);

    if (!rawInput.trim()) {
      setParseError("Please paste some data to import.");
      return;
    }

    try {
      const lines = rawInput.trim().split("\n");
      const powerups: PowerupData[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines

        // Support both tab-separated (TSV) and comma-separated (CSV)
        const delimiter = line.includes("\t") ? "\t" : ",";
        const parts = line.split(delimiter).map(p => p.trim());

        if (parts.length < 3) {
          setParseError(`Line ${i + 1}: Expected at least 3 columns (poweruptype, task, points/completion), got ${parts.length}`);
          return;
        }

        // Powerup type - cannot be empty
        const powerupType = parts[0];
        if (!powerupType) {
          setParseError(`Line ${i + 1}: Powerup type cannot be empty`);
          return;
        }

        // Task label - cannot be empty
        const label = parts[1];
        if (!label) {
          setParseError(`Line ${i + 1}: Task label cannot be empty`);
          return;
        }

        // Points per completion - cannot be empty (allows decimals)
        if (!parts[2] || parts[2].trim() === "") {
          setParseError(`Line ${i + 1}: Points per completion cannot be empty`);
          return;
        }
        const pointsPerCompletion = parseFloat(parts[2]);
        if (isNaN(pointsPerCompletion) || pointsPerCompletion <= 0) {
          setParseError(`Line ${i + 1}: Points per completion must be a positive number, got "${parts[2]}"`);
          return;
        }

        // Max completions - default to 1 if empty
        const maxCompletions = parts[3] && parts[3].trim() !== "" ? parseInt(parts[3], 10) : 1;
        if (isNaN(maxCompletions) || maxCompletions < 1) {
          setParseError(`Line ${i + 1}: Max completions must be a positive number, got "${parts[3]}"`);
          return;
        }

        // Min completions - default to 1 if empty
        const minCompletions = parts[4] && parts[4].trim() !== "" ? parseInt(parts[4], 10) : 1;
        if (isNaN(minCompletions) || minCompletions < 1) {
          setParseError(`Line ${i + 1}: Min completions must be a positive number, got "${parts[4]}"`);
          return;
        }

        if (minCompletions > maxCompletions) {
          setParseError(`Line ${i + 1}: Min completions (${minCompletions}) cannot be greater than max completions (${maxCompletions})`);
          return;
        }

        // Claim type - cannot be empty
        if (!parts[5] || parts[5].trim() === "") {
          setParseError(`Line ${i + 1}: Claim type cannot be empty`);
          return;
        }
        const claimType = parts[5].toLowerCase();
        if (!["eachteam", "firstteam", "unlimited"].includes(claimType)) {
          setParseError(`Line ${i + 1}: Claim type must be "eachTeam", "firstTeam", or "unlimited", got "${parts[5]}"`);
          return;
        }

        const normalizedClaimType = claimType === "eachteam" ? "eachTeam" : claimType === "firstteam" ? "firstTeam" : "unlimited";
        
        // Instructions - leave empty if not provided
        const instructions = parts[6] && parts[6].trim() !== "" ? parts[6] : "";
        
        // URL - cannot be empty
        const image = parts[7] || "";
        if (!image) {
          setParseError(`Line ${i + 1}: URL cannot be empty`);
          return;
        }

        powerups.push({
          powerupType,
          label,
          pointsPerCompletion,
          maxCompletions,
          minCompletions,
          claimType: normalizedClaimType as "eachTeam" | "firstTeam" | "unlimited",
          instructions,
          image,
        });
      }

      if (powerups.length === 0) {
        setParseError("No valid powerups found. Please check your input format.");
        return;
      }

      setPreview(powerups);
    } catch (error) {
      setParseError(`Parse error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleImport = () => {
    if (preview && preview.length > 0) {
      onImport(preview);
      setRawInput("");
      setPreview(null);
      setParseError(null);
      onClose();
    }
  };

  const handleClose = () => {
    setRawInput("");
    setPreview(null);
    setParseError(null);
    onClose();
  };

  const getClaimTypeColor = (claimType: string) => {
    switch (claimType) {
      case "eachTeam": return isDark ? "bg-blue-800 text-blue-100" : "bg-blue-200 text-blue-900";
      case "firstTeam": return isDark ? "bg-orange-800 text-orange-100" : "bg-orange-200 text-orange-900";
      case "unlimited": return isDark ? "bg-green-800 text-green-100" : "bg-green-200 text-green-900";
      default: return isDark ? "bg-slate-700 text-slate-300" : "bg-slate-300 text-slate-700";
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isDark={isDark}>
      <div className="space-y-4 max-w-4xl">
        <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
          📦 Import Powerups
        </h2>

        <div className="space-y-2">
          <p className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            Paste powerup data in CSV or TSV format. Each line should contain:
          </p>
          <div className={`text-xs font-mono p-3 rounded-lg ${isDark ? "bg-slate-900 text-slate-300" : "bg-slate-100 text-slate-700"}`}>
            <div className="font-semibold mb-1">Format:</div>
            <div>poweruptype, task, points/completion, max completions, min completions, claim type, instructions, url</div>
            <div className="mt-2 font-semibold">Example:</div>
            <div>skip1, Speed Challenge, 2, 3, 1, eachTeam, Complete a timed challenge, https://example.com/image.png</div>
            <div>back2, Strategy Task, 3, 2, 2, firstTeam, Work together on this, </div>
            <div>clearCooldown, Quick Task, 1, 5, 1, unlimited, Simple task for everyone, </div>
          </div>
          <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Note: Powerup type, task, points per completion, and claim type are required. Claim type: "eachTeam", "firstTeam", or "unlimited". Max/min completions default to 1 if empty. Instructions are optional (leave empty if none). URL is required.
          </p>
        </div>

        {!preview ? (
          <>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                Paste Powerup Data:
              </label>
              <textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder="skip1, Task name, 2, 3, 1, eachTeam, Instructions, https://image.url&#10;back2, Another task, 3, 2, 2, firstTeam, More instructions, "
                rows={10}
                className={`
                  w-full px-3 py-2 rounded-lg border font-mono text-sm
                  ${isDark
                    ? "bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-500"
                    : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"}
                  focus:outline-none focus:border-blue-500
                `}
              />
            </div>

            {parseError && (
              <div className={`p-3 rounded-lg ${isDark ? "bg-red-900/30 text-red-300" : "bg-red-100 text-red-700"}`}>
                <p className="font-semibold">❌ Parse Error</p>
                <p className="text-sm mt-1">{parseError}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="primary"
                isDark={isDark}
                onClick={handleParse}
                disabled={!rawInput.trim()}
              >
                Parse & Preview
              </Button>
              <Button
                variant="secondary"
                isDark={isDark}
                onClick={handleClose}
              >
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className={`p-4 rounded-lg ${isDark ? "bg-slate-900" : "bg-slate-100"}`}>
              <h3 className={`font-semibold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>
                Preview: {preview.length} powerup{preview.length !== 1 ? "s" : ""} to import
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {preview.map((powerup, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${isDark ? "bg-yellow-900/60 text-yellow-100" : "bg-yellow-200 text-yellow-900"}`}>
                          {powerup.powerupType}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getClaimTypeColor(powerup.claimType)}`}>
                          {powerup.claimType}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                          {powerup.label}
                        </p>
                        <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                          {powerup.pointsPerCompletion} pts/completion • {powerup.minCompletions}-{powerup.maxCompletions} completions
                        </p>
                        {powerup.instructions && (
                          <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                            {powerup.instructions}
                          </p>
                        )}
                        {powerup.image && (
                          <p className={`text-xs mt-1 font-mono ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                            🖼️ {powerup.image}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`p-3 rounded-lg ${isDark ? "bg-blue-900/30 text-blue-300" : "bg-blue-100 text-blue-700"}`}>
              <p className="text-sm">
                ✓ Ready to import. These powerup tiles will be added to the game.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="primary"
                isDark={isDark}
                onClick={handleImport}
              >
                Import {preview.length} Powerup{preview.length !== 1 ? "s" : ""}
              </Button>
              <Button
                variant="secondary"
                isDark={isDark}
                onClick={() => {
                  setPreview(null);
                  setParseError(null);
                }}
              >
                Back to Edit
              </Button>
              <Button
                variant="secondary"
                isDark={isDark}
                onClick={handleClose}
              >
                Cancel
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
