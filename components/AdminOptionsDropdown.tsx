"use client";

interface AdminOptionsDropdownProps {
  isDark: boolean;
  onClose: () => void;
  onRandomizeDifficulties: () => void;
  onRandomizeTiles: () => void;
}

export default function AdminOptionsDropdown({
  isDark,
  onClose,
  onRandomizeDifficulties,
  onRandomizeTiles,
}: AdminOptionsDropdownProps) {
  const menuItems = [
    { label: "👥 Form teams", onClick: () => { onClose(); alert("Form teams (Draft) - Coming soon!"); } },
    { label: "📥 Import tasks", onClick: () => { onClose(); alert("Import tasks - Coming soon!"); } },
    { label: "📦 Import powerups", onClick: () => { onClose(); alert("Import powerups - Coming soon!"); } },
    { label: "📊 Gradient settings", onClick: () => { onClose(); alert("Gradient settings - Coming soon!"); } },
    { label: "🎲 Randomize difficulties", onClick: onRandomizeDifficulties },
    { label: "🎲 Randomize tiles", onClick: onRandomizeTiles },
    { label: "👁️ Disable Fog of War (Testing)", onClick: () => { onClose(); alert("Fog of War toggle - Coming soon!"); } },
    { label: "💾 Download Game Backup", onClick: () => { onClose(); alert("Download backup - Coming soon!"); } },
    { label: "📂 Restore Game Backup", onClick: () => { onClose(); alert("Restore backup - Coming soon!"); } },
    { label: "👤 Manage Admins", onClick: () => { onClose(); alert("Manage admins - Coming soon!"); } },
    { label: "🔑 Change Password", onClick: () => { onClose(); alert("Change password - Coming soon!"); } },
    { label: "🔐 Set Team Passwords", onClick: () => { onClose(); alert("Set team passwords - Coming soon!"); } },
    { label: "↩️ Undo", onClick: () => { onClose(); alert("Undo - Coming soon!"); } },
    {
      label: "🔄 Reset all",
      onClick: () => {
        onClose();
        if (confirm("Reset entire game? This cannot be undone!")) {
          alert("Reset all - Coming soon!");
        }
      },
      isDanger: true,
    },
  ];

  return (
    <div
      className={`
        absolute right-0 top-full mt-2 z-50 w-64 rounded-xl border shadow-lg max-h-[80vh] overflow-y-auto
        ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}
      `}
    >
      {menuItems.map((item, index) => (
        <button
          key={index}
          onClick={item.onClick}
          className={`
            w-full px-4 py-3 text-left text-sm
            ${index < menuItems.length - 1 ? "border-b" : ""}
            ${
              item.isDanger
                ? isDark ? "text-red-400" : "text-red-600"
                : isDark ? "text-slate-100" : "text-slate-900"
            }
            ${
              isDark
                ? "hover:bg-slate-700 border-slate-700"
                : "hover:bg-slate-50 border-slate-200"
            }
          `}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
