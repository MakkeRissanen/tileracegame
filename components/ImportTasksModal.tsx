"use client";

import { useState } from "react";
import { Modal, Button } from "./ui";

interface ImportTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (tasks: { difficulty: number; label: string; maxCompletions: number; minCompletions: number; instructions: string; image: string }[]) => void;
  isDark: boolean;
}

export default function ImportTasksModal({
  isOpen,
  onClose,
  onImport,
  isDark,
}: ImportTasksModalProps) {
  const [rawInput, setRawInput] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ difficulty: number; label: string; maxCompletions: number; minCompletions: number; instructions: string; image: string }[] | null>(null);

  const handleParse = () => {
    setParseError(null);
    setPreview(null);

    if (!rawInput.trim()) {
      setParseError("Please paste some data to import.");
      return;
    }

    try {
      const lines = rawInput.trim().split("\n");
      const tasks: { difficulty: number; label: string; maxCompletions: number; minCompletions: number; instructions: string; image: string }[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines

        // Support both tab-separated (TSV) and comma-separated (CSV)
        const delimiter = line.includes("\t") ? "\t" : ",";
        const parts = line.split(delimiter).map(p => p.trim());

        if (parts.length < 2) {
          setParseError(`Line ${i + 1}: Expected at least 2 columns (task, difficulty), got ${parts.length}`);
          return;
        }

        // Task label - cannot be empty
        const label = parts[0];
        if (!label) {
          setParseError(`Line ${i + 1}: Task label cannot be empty`);
          return;
        }

        // Difficulty - cannot be empty
        if (!parts[1]) {
          setParseError(`Line ${i + 1}: Difficulty cannot be empty`);
          return;
        }
        const difficulty = parseInt(parts[1], 10);
        if (isNaN(difficulty) || difficulty < 1 || difficulty > 3) {
          setParseError(`Line ${i + 1}: Difficulty must be 1 (Easy), 2 (Medium), or 3 (Hard), got "${parts[1]}"`);
          return;
        }

        // Max completions - default to 1 if empty
        const maxCompletions = parts[2] && parts[2].trim() !== "" ? parseInt(parts[2], 10) : 1;
        if (isNaN(maxCompletions) || maxCompletions < 1) {
          setParseError(`Line ${i + 1}: Max completions must be a positive number, got "${parts[2]}"`);
          return;
        }

        // Min completions - default to 1 if empty
        const minCompletions = parts[3] && parts[3].trim() !== "" ? parseInt(parts[3], 10) : 1;
        if (isNaN(minCompletions) || minCompletions < 1) {
          setParseError(`Line ${i + 1}: Min completions must be a positive number, got "${parts[3]}"`);
          return;
        }

        if (minCompletions > maxCompletions) {
          setParseError(`Line ${i + 1}: Min completions (${minCompletions}) cannot be greater than max completions (${maxCompletions})`);
          return;
        }

        // Instructions - default to "No further instructions given." if empty
        const instructions = parts[4] && parts[4].trim() !== "" ? parts[4] : "No further instructions given.";
        
        // URL - cannot be empty
        const image = parts[5] || "";
        if (!image) {
          setParseError(`Line ${i + 1}: URL cannot be empty`);
          return;
        }

        tasks.push({
          difficulty,
          label,
          maxCompletions,
          minCompletions,
          instructions,
          image,
        });
      }

      if (tasks.length === 0) {
        setParseError("No valid tasks found. Please check your input format.");
        return;
      }

      setPreview(tasks);
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

  const getDifficultyLabel = (diff: number) => {
    switch (diff) {
      case 1: return "Easy";
      case 2: return "Medium";
      case 3: return "Hard";
      default: return "Unknown";
    }
  };

  const getDifficultyColor = (diff: number) => {
    switch (diff) {
      case 1: return isDark ? "bg-emerald-800 text-emerald-100" : "bg-emerald-200 text-emerald-900";
      case 2: return isDark ? "bg-amber-800 text-amber-100" : "bg-amber-200 text-amber-900";
      case 3: return isDark ? "bg-purple-800 text-purple-100" : "bg-purple-200 text-purple-900";
      default: return isDark ? "bg-slate-700 text-slate-300" : "bg-slate-300 text-slate-700";
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isDark={isDark}>
      <div className="space-y-4 max-w-4xl">
        <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
          📥 Import Tasks
        </h2>

        <div className="space-y-2">
          <p className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            Paste task data in CSV or TSV format. Each line should contain:
          </p>
          <div className={`text-xs font-mono p-3 rounded-lg ${isDark ? "bg-slate-900 text-slate-300" : "bg-slate-100 text-slate-700"}`}>
            <div className="font-semibold mb-1">Format:</div>
            <div>task, difficulty, max completions, min completions, instructions, url</div>
            <div className="mt-2 font-semibold">Example:</div>
            <div>Complete a coding challenge, 1, 3, 1, Solve any LeetCode problem, https://example.com/image.png</div>
            <div>Team presentation, 2, 2, 2, Present your project to the group, </div>
            <div>Build a feature, 3, 1, 1, Implement a new feature from scratch, </div>
          </div>
          <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Note: Task and difficulty are required. Difficulty: 1 (Easy), 2 (Medium), 3 (Hard). Max/min completions default to 1 if empty. Instructions default to "No further instructions given." if empty. URL is required.
          </p>
        </div>

        {!preview ? (
          <>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                Paste Task Data:
              </label>
              <textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder="Task name, 1, 3, 1, Instructions, https://image.url&#10;Another task, 2, 2, 2, More instructions, "
                rows={10}
                className={`
                  w-full px-3 py-2 rounded-lg border font-mono text-sm
                  ${isDark
                    ? "bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500"
                    : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"}
                  focus:outline-none focus:ring-2 focus:ring-blue-500
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
                Preview: {preview.length} task{preview.length !== 1 ? "s" : ""} to import
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {preview.map((task, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getDifficultyColor(task.difficulty)}`}>
                        {getDifficultyLabel(task.difficulty)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                          {task.label}
                        </p>
                        <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                          {task.minCompletions}-{task.maxCompletions} player{task.maxCompletions !== 1 ? "s" : ""}
                        </p>
                        {task.instructions && (
                          <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                            {task.instructions}
                          </p>
                        )}
                        {task.image && (
                          <p className={`text-xs mt-1 font-mono ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                            🖼️ {task.image}
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
                ✓ Ready to import. These tasks will be added to the task pool and can be assigned to tiles.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="primary"
                isDark={isDark}
                onClick={handleImport}
              >
                Import {preview.length} Task{preview.length !== 1 ? "s" : ""}
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
