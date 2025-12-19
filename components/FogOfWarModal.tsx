"use client";

interface FogOfWarModalProps {
  isDark: boolean;
  currentMode: "none" | "admin" | "all";
  onClose: () => void;
  onSetMode: (mode: "none" | "admin" | "all") => void;
}

export default function FogOfWarModal({
  isDark,
  currentMode,
  onClose,
  onSetMode,
}: FogOfWarModalProps) {
  const handleSetMode = (mode: "none" | "admin" | "all") => {
    onSetMode(mode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className={`
          w-full max-w-md rounded-xl border p-6 shadow-xl
          ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}
        `}
      >
        <h2
          className={`
            mb-4 text-xl font-bold
            ${isDark ? "text-slate-100" : "text-slate-900"}
          `}
        >
          👁️ Fog of War Settings
        </h2>

        <div className="space-y-3 mb-6">
          <p
            className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
          >
            Current mode: <span className="font-semibold">{currentMode === "none" ? "Enabled" : currentMode === "admin" ? "Disabled for Admin" : "Disabled for Everyone"}</span>
          </p>

          <div className="space-y-2">
            <button
              onClick={() => handleSetMode("admin")}
              disabled={currentMode === "admin"}
              className={`
                w-full rounded-lg border px-4 py-3 text-left transition-colors
                ${
                  currentMode === "admin"
                    ? isDark
                      ? "border-blue-500 bg-blue-500/20 text-blue-400"
                      : "border-blue-500 bg-blue-50 text-blue-600"
                    : isDark
                    ? "border-slate-600 bg-slate-700 text-slate-100 hover:bg-slate-600"
                    : "border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
                }
                disabled:cursor-not-allowed
              `}
            >
              <div className="font-semibold">Disable for Admin Only</div>
              <div className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Admin can see all tiles, teams still have fog of war
              </div>
            </button>

            <button
              onClick={() => handleSetMode("all")}
              disabled={currentMode === "all"}
              className={`
                w-full rounded-lg border px-4 py-3 text-left transition-colors
                ${
                  currentMode === "all"
                    ? isDark
                      ? "border-blue-500 bg-blue-500/20 text-blue-400"
                      : "border-blue-500 bg-blue-50 text-blue-600"
                    : isDark
                    ? "border-slate-600 bg-slate-700 text-slate-100 hover:bg-slate-600"
                    : "border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
                }
                disabled:cursor-not-allowed
              `}
            >
              <div className="font-semibold">Disable for Everyone</div>
              <div className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                All tiles visible to everyone (testing mode)
              </div>
            </button>

            <button
              onClick={() => handleSetMode("none")}
              disabled={currentMode === "none"}
              className={`
                w-full rounded-lg border px-4 py-3 text-left transition-colors
                ${
                  currentMode === "none"
                    ? isDark
                      ? "border-green-500 bg-green-500/20 text-green-400"
                      : "border-green-500 bg-green-50 text-green-600"
                    : isDark
                    ? "border-slate-600 bg-slate-700 text-slate-100 hover:bg-slate-600"
                    : "border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
                }
                disabled:cursor-not-allowed
              `}
            >
              <div className="font-semibold">Enable Fog of War</div>
              <div className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Normal mode - tiles revealed as teams progress
              </div>
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className={`
            w-full rounded-lg px-4 py-2 font-medium transition-colors
            ${
              isDark
                ? "bg-slate-700 text-slate-100 hover:bg-slate-600"
                : "bg-slate-100 text-slate-900 hover:bg-slate-200"
            }
          `}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
