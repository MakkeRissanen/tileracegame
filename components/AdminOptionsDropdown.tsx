"use client";

import { useState } from "react";

interface AdminOptionsDropdownProps {
  isDark: boolean;
  onClose: () => void;
  onRandomizeTiles: () => void;
  onFormTeams: () => void;
  onImportTasks: () => void;
  onImportPowerups: () => void;
  onGradientSettings: () => void;
  onDisableFogOfWar: () => void;
  fogOfWarMode: "none" | "admin" | "all";
  onManageAdmins: () => void;
  onChangePassword: () => void;
  onSetTeamPasswords: () => void;
  onUndo: () => void;
  onResetAll: () => void;
}

export default function AdminOptionsDropdown({
  isDark,
  onClose,
  onRandomizeTiles,
  onFormTeams,
  onImportTasks,
  onImportPowerups,
  onGradientSettings,
  onDisableFogOfWar,
  fogOfWarMode,
  onManageAdmins,
  onChangePassword,
  onSetTeamPasswords,
  onUndo,
  onResetAll,
}: AdminOptionsDropdownProps) {
  const [showDangerZone, setShowDangerZone] = useState(false);

  const fogOfWarLabel = fogOfWarMode === "none" 
    ? "👁️ Fog of War Settings" 
    : fogOfWarMode === "admin"
    ? "👁️ Fog of War (Admin Only)"
    : "👁️ Fog of War (Disabled)";
    
  const menuItems = [
    { label: "👥 Form teams", onClick: () => { onClose(); onFormTeams(); } },
    { label: "📥 Import tasks", onClick: () => { onClose(); onImportTasks(); } },
    { label: "📦 Import powerups", onClick: () => { onClose(); onImportPowerups(); } },
    { label: "🎲 Randomize difficulties", onClick: () => { onClose(); onGradientSettings(); } },
    { label: "🎲 Randomize tiles", onClick: onRandomizeTiles },
    { label: fogOfWarLabel, onClick: () => { onClose(); onDisableFogOfWar(); } },
    { label: "💾 Download Game Backup", onClick: () => { onClose(); alert("Download backup - Coming soon!"); } },
    { label: "📂 Restore Game Backup", onClick: () => { onClose(); alert("Restore backup - Coming soon!"); } },
    { label: "👤 Manage Admins", onClick: () => { onClose(); onManageAdmins(); } },
    { label: "🔑 Change Password", onClick: () => { onClose(); onChangePassword(); } },
    { label: "🔐 Set Team Passwords", onClick: () => { onClose(); onSetTeamPasswords(); } },
    { label: "↩️ Undo", onClick: () => { onClose(); onUndo(); } },
  ];

  return (
    <div
      className={`
        absolute right-0 top-full mt-2 z-50 w-64 rounded-xl border shadow-lg max-h-[80vh] overflow-y-auto
        ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}
      `}
    >
      {!showDangerZone ? (
        <>
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className={`
                w-full px-4 py-3 text-left text-sm
                border-b
                ${isDark ? "text-slate-100 hover:bg-slate-700 border-slate-700" : "text-slate-900 hover:bg-slate-50 border-slate-200"}
              `}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => setShowDangerZone(true)}
            className={`
              w-full px-4 py-3 text-left text-sm
              ${isDark ? "text-red-400 hover:bg-red-900/20" : "text-red-600 hover:bg-red-50"}
            `}
          >
            ⚠️ Danger Zone
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => setShowDangerZone(false)}
            className={`
              w-full px-4 py-3 text-left text-sm border-b
              ${isDark ? "text-slate-300 hover:bg-slate-700 border-slate-700" : "text-slate-600 hover:bg-slate-50 border-slate-200"}
            `}
          >
            ← Back
          </button>
          <div className={`px-4 py-2 text-xs font-semibold ${isDark ? "text-red-400" : "text-red-600"}`}>
            DANGER ZONE
          </div>
          <button
            onClick={() => {
              onClose();
              if (confirm("⚠️ WARNING: This will DELETE ALL game data including teams, tiles, events, and progress. This action CANNOT be undone!\n\nAre you absolutely sure?")) {
                if (confirm("Last chance: Click OK to permanently reset everything.")) {
                  onResetAll();
                }
              }
            }}
            className={`
              w-full px-4 py-3 text-left text-sm
              ${isDark ? "text-red-400 hover:bg-red-900/30" : "text-red-600 hover:bg-red-50"}
            `}
          >
            🔄 Reset All
          </button>
        </>
      )}
    </div>
  );
}
