"use client";

import { Modal, Button } from "./ui";
import { GameState } from "@/types/game";

interface UndoHistoryModalProps {
  isOpen: boolean;
  isDark: boolean;
  currentState: GameState;
  onClose: () => void;
  onUndo: () => void;
}

export default function UndoHistoryModal({
  isOpen,
  isDark,
  currentState,
  onClose,
  onUndo,
}: UndoHistoryModalProps) {
  const history = currentState.eventHistory || [];
  
  // Strip undo prefixes to get the original action
  const stripUndoPrefix = (message: string): string => {
    // Remove all instances of undo prefixes to get to the original action
    let cleaned = message;
    while (cleaned.startsWith("⎌ Undid: ")) {
      cleaned = cleaned.substring("⎌ Undid: ".length);
    }
    return cleaned;
  };

  // Get the action that created a specific state by comparing log arrays
  // Logs are prepended (newest first), so we look at the first entry
  const getActionForState = (stateIndex: number): { message: string; timestamp: number } => {
    // For the current state (after all history), use its first log entry
    if (stateIndex === history.length) {
      if (currentState.log && currentState.log.length > 0) {
        const firstLog = currentState.log[0]; // Newest log
        return { message: stripUndoPrefix(firstLog.message), timestamp: firstLog.ts };
      }
      return { message: "Unknown action", timestamp: Date.now() };
    }
    
    // For historical states, find what log was added when this state was created
    // Compare with the next state (or current state if it's the last history entry)
    const thisState = history[stateIndex];
    const nextState = stateIndex + 1 < history.length ? history[stateIndex + 1] : currentState;
    
    // The log entry that was added is at index 0 of the next state
    // (since it wasn't in this state but is in the next state)
    if (nextState.log && nextState.log.length > 0) {
      // Find the first log in nextState that's not in thisState
      const thisLogIds = new Set(thisState.log?.map(l => l.id) || []);
      const newLog = nextState.log.find(l => !thisLogIds.has(l.id));
      if (newLog) {
        return { message: stripUndoPrefix(newLog.message), timestamp: newLog.ts };
      }
      // Fallback: use the first log of next state
      return { message: stripUndoPrefix(nextState.log[0].message), timestamp: nextState.log[0].ts };
    }
    
    return { message: "Unknown action", timestamp: Date.now() };
  };

  // Get the most recent action (what would be undone)
  // Skip undo entries to show the actual action
  const getMostRecentAction = (): { message: string; timestamp: number } => {
    if (currentState.log && currentState.log.length > 0) {
      // Find the first non-undo log entry
      for (const log of currentState.log) {
        if (!log.message.startsWith("⎌ Undid: ")) {
          return { message: log.message, timestamp: log.ts };
        }
      }
      // If all are undo entries, just use the first one stripped
      const firstLog = currentState.log[0];
      return { message: stripUndoPrefix(firstLog.message), timestamp: firstLog.ts };
    }
    return { message: "No recent action", timestamp: Date.now() };
  };

  const handleUndo = () => {
    const action = getMostRecentAction();
    if (confirm(`Are you sure you want to undo this action?\n\n"${action.message}"`)) {
      onUndo();
    }
  };

  const formatTimestamp = (ts: number): string => {
    const date = new Date(ts);
    return date.toLocaleTimeString();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isDark={isDark}>
      <div className="space-y-6">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
            Undo History
          </h2>
          <p className={`mt-2 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Review and undo recent actions. Actions are undone in reverse order.
          </p>
        </div>

        {history.length === 0 ? (
          <div className={`text-center py-8 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            <p className="text-lg">No history available</p>
            <p className="text-sm mt-2">Actions will appear here once you start making changes</p>
          </div>
        ) : (
          <>
            {/* Current Action (Next to Undo) */}
            <div>
              <h3 className={`text-sm font-semibold mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                Next Action to Undo:
              </h3>
              <div className={`
                p-4 rounded-lg border-2
                ${isDark ? "bg-red-900/20 border-red-700" : "bg-red-50 border-red-300"}
              `}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div className="flex-1">
                    <p className={`font-medium ${isDark ? "text-red-300" : "text-red-700"}`}>
                      {getMostRecentAction().message}
                    </p>
                    <p className={`text-xs mt-1 ${isDark ? "text-red-400" : "text-red-600"}`}>
                      {formatTimestamp(getMostRecentAction().timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* History List */}
            <div>
              <h3 className={`text-sm font-semibold mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                Previous Actions ({history.length}):
              </h3>
              <div className={`
                max-h-64 overflow-y-auto space-y-2 p-3 rounded-lg
                ${isDark ? "bg-slate-700/50" : "bg-slate-100"}
              `}>
                {[...Array(history.length)].map((_, index) => {
                  // Show in reverse order (most recent first)
                  const actualIndex = history.length - 1 - index;
                  const actionInfo = getActionForState(actualIndex);
                  
                  return (
                    <div
                      key={actualIndex}
                      className={`
                        p-3 rounded-lg
                        ${isDark ? "bg-slate-800 text-slate-200" : "bg-white text-slate-800"}
                      `}
                    >
                      <div className="flex items-start gap-2">
                        <span className={`text-xs font-mono ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                          #{actualIndex + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm">{actionInfo.message}</p>
                          <p className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                            {formatTimestamp(actionInfo.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleUndo}
                variant="danger"
                isDark={isDark}
                className="flex-1"
              >
                ⚠️ Undo Last Action
              </Button>
              <Button
                onClick={onClose}
                variant="secondary"
                isDark={isDark}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </>
        )}

        {history.length === 0 && (
          <div className="flex justify-end">
            <Button onClick={onClose} variant="secondary" isDark={isDark}>
              Close
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
