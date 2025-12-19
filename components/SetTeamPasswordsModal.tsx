"use client";

import { useState } from "react";
import { Team } from "@/types/game";

interface SetTeamPasswordsModalProps {
  isOpen: boolean;
  isDark: boolean;
  teams: Team[];
  onClose: () => void;
  onSetAllPasswords: (password: string) => void;
  onSetTeamPassword: (teamId: string, password: string) => void;
}

export default function SetTeamPasswordsModal({
  isDark,
  teams,
  onClose,
  onSetAllPasswords,
  onSetTeamPassword,
}: SetTeamPasswordsModalProps) {
  const [globalPassword, setGlobalPassword] = useState("");
  const [individualPasswords, setIndividualPasswords] = useState<Record<string, string>>({});

  const handleSetAll = () => {
    if (!globalPassword.trim()) {
      alert("Password cannot be empty");
      return;
    }
    if (confirm(`Set password "${globalPassword}" for ALL teams?`)) {
      onSetAllPasswords(globalPassword);
      setGlobalPassword("");
    }
  };

  const handleSetIndividual = (teamId: string) => {
    const password = individualPasswords[teamId];
    if (!password || !password.trim()) {
      alert("Password cannot be empty");
      return;
    }
    onSetTeamPassword(teamId, password);
    setIndividualPasswords({ ...individualPasswords, [teamId]: "" });
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
          🔐 Set Team Passwords
        </h2>

        {/* Set All Teams Password */}
        <div className="mb-6">
          <h3 className={`text-sm font-semibold mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
            Set Password for All Teams
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={globalPassword}
              onChange={(e) => setGlobalPassword(e.target.value)}
              placeholder="Enter password for all teams"
              className={`
                flex-1 rounded-lg border px-3 py-2
                ${
                  isDark
                    ? "border-slate-600 bg-slate-700 text-slate-100 placeholder-slate-400"
                    : "border-slate-300 bg-white text-slate-900 placeholder-slate-400"
                }
              `}
            />
            <button
              onClick={handleSetAll}
              className={`
                rounded-lg px-4 py-2 font-medium transition-colors
                ${
                  isDark
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }
              `}
            >
              Set All
            </button>
          </div>
        </div>

        {/* Individual Team Passwords */}
        <div className="mb-6">
          <h3 className={`text-sm font-semibold mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
            Set Individual Team Passwords
          </h3>
          <div className="space-y-3">
            {teams.length === 0 ? (
              <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                No teams available
              </p>
            ) : (
              teams.map((team) => (
                <div
                  key={team.id}
                  className={`
                    rounded-lg border p-3
                    ${isDark ? "border-slate-600 bg-slate-700" : "border-slate-300 bg-slate-50"}
                  `}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-4 h-4 rounded ${team.color}`} />
                    <span className={`font-medium ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                      {team.name}
                    </span>
                    {team.password && (
                      <span className={`text-xs ${isDark ? "text-green-400" : "text-green-600"}`}>
                        ✓ Password set
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={individualPasswords[team.id] || ""}
                      onChange={(e) =>
                        setIndividualPasswords({ ...individualPasswords, [team.id]: e.target.value })
                      }
                      placeholder={`Password for ${team.name}`}
                      className={`
                        flex-1 rounded-lg border px-3 py-2 text-sm
                        ${
                          isDark
                            ? "border-slate-600 bg-slate-800 text-slate-100 placeholder-slate-400"
                            : "border-slate-300 bg-white text-slate-900 placeholder-slate-400"
                        }
                      `}
                    />
                    <button
                      onClick={() => handleSetIndividual(team.id)}
                      className={`
                        rounded-lg px-3 py-2 text-sm font-medium transition-colors
                        ${
                          isDark
                            ? "bg-slate-600 text-slate-100 hover:bg-slate-500"
                            : "bg-slate-200 text-slate-900 hover:bg-slate-300"
                        }
                      `}
                    >
                      Set
                    </button>
                  </div>
                </div>
              ))
            )}
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
