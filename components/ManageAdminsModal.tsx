"use client";

import { useState } from "react";
import { Admin } from "@/types/game";

interface ManageAdminsModalProps {
  isOpen: boolean;
  isDark: boolean;
  admins: Admin[];
  onClose: () => void;
  onAddAdmin: (name: string, password: string, isMaster: boolean) => void;
  onRemoveAdmin: (adminId: string) => void;
}

export default function ManageAdminsModal({
  isDark,
  admins,
  onClose,
  onAddAdmin,
  onRemoveAdmin,
}: ManageAdminsModalProps) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isMaster, setIsMaster] = useState(false);

  const handleAdd = () => {
    if (!name.trim() || !password.trim()) {
      alert("Name and password are required");
      return;
    }
    onAddAdmin(name.trim(), password, isMaster);
    setName("");
    setPassword("");
    setIsMaster(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className={`
          w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border p-6 shadow-xl
          ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}
        `}
      >
        <h2
          className={`
            mb-4 text-xl font-bold
            ${isDark ? "text-slate-100" : "text-slate-900"}
          `}
        >
          👤 Manage Admins
        </h2>

        {/* Current Admins List */}
        <div className="mb-6">
          <h3 className={`text-sm font-semibold mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
            Current Admins
          </h3>
          <div className="space-y-2">
            {admins.length === 0 ? (
              <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                No admins configured
              </p>
            ) : (
              admins.map((admin) => (
                <div
                  key={admin.id}
                  className={`
                    flex items-center justify-between rounded-lg border p-3
                    ${isDark ? "border-slate-600 bg-slate-700" : "border-slate-300 bg-slate-50"}
                  `}
                >
                  <div>
                    <div className={`font-medium ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                      {admin.name}
                      {admin.isMaster && (
                        <span className={`ml-2 text-xs ${isDark ? "text-blue-400" : "text-blue-600"}`}>
                          (Master)
                        </span>
                      )}
                    </div>
                  </div>
                  {!admin.isMaster && (
                    <button
                      onClick={() => {
                        if (confirm(`Remove admin "${admin.name}"?`)) {
                          onRemoveAdmin(admin.id);
                        }
                      }}
                      className={`
                        px-3 py-1 text-sm rounded transition-colors
                        ${
                          isDark
                            ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                            : "bg-red-100 text-red-600 hover:bg-red-200"
                        }
                      `}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add New Admin Form */}
        <div className="mb-6">
          <h3 className={`text-sm font-semibold mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
            Add New Admin
          </h3>
          <div className="space-y-3">
            <div>
              <label className={`block text-sm mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                Admin Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter admin name"
                className={`
                  w-full rounded-lg border px-3 py-2 text-sm
                  ${
                    isDark
                      ? "border-slate-600 bg-slate-700 text-slate-100 placeholder-slate-400"
                      : "border-slate-300 bg-white text-slate-900 placeholder-slate-400"
                  }
                `}
              />
            </div>
            <div>
              <label className={`block text-sm mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className={`
                  w-full rounded-lg border px-3 py-2 text-sm
                  ${
                    isDark
                      ? "border-slate-600 bg-slate-700 text-slate-100 placeholder-slate-400"
                      : "border-slate-300 bg-white text-slate-900 placeholder-slate-400"
                  }
                `}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isMaster"
                checked={isMaster}
                onChange={(e) => setIsMaster(e.target.checked)}
                className="rounded"
              />
              <label
                htmlFor="isMaster"
                className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}
              >
                Master Admin (cannot be removed)
              </label>
            </div>
            <button
              onClick={handleAdd}
              className={`
                w-full rounded-lg px-4 py-2 font-medium transition-colors
                ${
                  isDark
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }
              `}
            >
              Add Admin
            </button>
          </div>
        </div>

        {/* Close Button */}
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
          Close
        </button>
      </div>
    </div>
  );
}
