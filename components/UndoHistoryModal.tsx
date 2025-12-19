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
  
  // Get the action description from the most recent log entry
  const getActionDescription = (state: GameState): string => {
    if (state.log && state.log.length > 0) {
      return state.log[state.log.length - 1].message;
    }
    return "Unknown action";
  };

  // Get the most recent action (what would be undone)
  const getMostRecentAction = (): string => {
    if (currentState.log && currentState.log.length > 0) {
      return currentState.log[currentState.log.length - 1].message;
    }
    return "No recent action";
  };

  const handleUndo = () => {
    const action = getMostRecentAction();
    if (confirm(`Are you sure you want to undo this action?\n\n"${action}"`)) {
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
                      {getMostRecentAction()}
                    </p>
                    {currentState.log && currentState.log.length > 0 && (
                      <p className={`text-xs mt-1 ${isDark ? "text-red-400" : "text-red-600"}`}>
                        {formatTimestamp(currentState.log[currentState.log.length - 1].ts)}
                      </p>
                    )}
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
                {[...history].reverse().map((state, index) => {
                  const actualIndex = history.length - 1 - index;
                  const action = getActionDescription(state);
                  const logEntry = state.log && state.log.length > 0 ? state.log[state.log.length - 1] : null;
                  
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
                          <p className="text-sm">{action}</p>
                          {logEntry && (
                            <p className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                              {formatTimestamp(logEntry.ts)}
                            </p>
                          )}
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
