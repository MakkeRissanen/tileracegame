"use client";

import { useState } from "react";

interface AdminOptionsDropdownProps {
  isDark: boolean;
  isMasterAdmin: boolean;
  onClose: () => void;
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
  adminBombVisibility: boolean;
  onToggleBombVisibility: () => void;
  onDownloadBackup: () => void;
  onRestoreBackup: () => void;
  onRecalculateFog: () => void;
}

export default function AdminOptionsDropdown({
  isDark,
  isMasterAdmin,
  onClose,
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
  adminBombVisibility,
  onToggleBombVisibility,
  onDownloadBackup,
  onRestoreBackup,
  onRecalculateFog,
}: AdminOptionsDropdownProps) {
  const [showDangerZone, setShowDangerZone] = useState(false);

  const fogOfWarLabel = fogOfWarMode === "none" 
    ? "👁️ Fog of War Settings" 
    : fogOfWarMode === "admin"
    ? "👁️ Fog of War (Admin Only)"
    : "👁️ Fog of War (Disabled)";

  const bombVisibilityLabel = adminBombVisibility ? "💣 Hide Time Bombs" : "👁️ Show Time Bombs";
    
  const allMenuItems = [
    { label: "👥 Form teams", onClick: () => { onClose(); onFormTeams(); }, masterOnly: true },
    { label: "📥 Import tasks", onClick: () => { onClose(); onImportTasks(); }, masterOnly: true },
    { label: "📦 Import powerups", onClick: () => { onClose(); onImportPowerups(); }, masterOnly: true },
    { label: "⚙️ Gradient settings", onClick: () => { onClose(); onGradientSettings(); }, masterOnly: true },
    { label: fogOfWarLabel, onClick: () => { onClose(); onDisableFogOfWar(); }, masterOnly: true },
    { label: "🔄 Recalculate Fog of War", onClick: () => { onClose(); onRecalculateFog(); }, masterOnly: true },
    { label: bombVisibilityLabel, onClick: () => { onToggleBombVisibility(); }, masterOnly: false },
    { label: "💾 Download Game Backup", onClick: () => { onClose(); onDownloadBackup(); }, masterOnly: true },
    { label: "📂 Restore Game Backup", onClick: () => { onClose(); onRestoreBackup(); }, masterOnly: true },
    { label: "👤 Manage Admins", onClick: () => { onClose(); onManageAdmins(); }, masterOnly: true },
    { label: "🔑 Change Password", onClick: () => { onClose(); onChangePassword(); }, masterOnly: true },
    { label: "🔐 Set Team Passwords", onClick: () => { onClose(); onSetTeamPasswords(); } , masterOnly: true },
    { label: "↩️ Undo", onClick: () => { onClose(); onUndo(); }, masterOnly: false },
  ];
  
  const menuItems = allMenuItems.filter(item => !item.masterOnly || isMasterAdmin);

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
          {isMasterAdmin && (
            <button
              onClick={() => setShowDangerZone(true)}
              className={`
                w-full px-4 py-3 text-left text-sm
                ${isDark ? "text-red-400 hover:bg-red-900/20" : "text-red-600 hover:bg-red-50"}
              `}
            >
              ⚠️ Danger Zone
            </button>
          )}
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
