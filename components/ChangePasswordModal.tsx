"use client";

import { useState } from "react";

interface ChangePasswordModalProps {
  isOpen: boolean;
  isDark: boolean;
  onClose: () => void;
  onChangePassword: (oldPassword: string, newPassword: string) => void;
}

export default function ChangePasswordModal({
  isDark,
  onClose,
  onChangePassword,
}: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      alert("All fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match");
      return;
    }
    if (newPassword.length < 4) {
      alert("New password must be at least 4 characters");
      return;
    }
    onChangePassword(oldPassword, newPassword);
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
          🔑 Change Admin Password
        </h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className={`block text-sm mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Current Password
            </label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Enter current password"
              className={`
                w-full rounded-lg border px-3 py-2
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
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className={`
                w-full rounded-lg border px-3 py-2
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
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className={`
                w-full rounded-lg border px-3 py-2
                ${
                  isDark
                    ? "border-slate-600 bg-slate-700 text-slate-100 placeholder-slate-400"
                    : "border-slate-300 bg-white text-slate-900 placeholder-slate-400"
                }
              `}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            className={`
              flex-1 rounded-lg px-4 py-2 font-medium transition-colors
              ${
                isDark
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }
            `}
          >
            Change Password
          </button>
          <button
            onClick={onClose}
            className={`
              flex-1 rounded-lg px-4 py-2 font-medium transition-colors
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
    </div>
  );
}
