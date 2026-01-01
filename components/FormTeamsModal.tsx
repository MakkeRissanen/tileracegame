"use client";

import { useState } from "react";

interface DraftState {
  step: "setup" | "picking" | "summary";
  playersText: string;
  teamsText: string;
  captains: Record<string, string>;
  available: string[];
  order: string[];
  pickIndex: number;
  picks: Record<string, string[]>;
  skippedPicks: Record<string, number>;
}

interface FormTeamsModalProps {
  isOpen: boolean;
  isDark: boolean;
  onClose: () => void;
  onApply: (teams: { name: string; captain: string; members: string[] }[]) => void;
}

export default function FormTeamsModal({
  isOpen,
  isDark,
  onClose,
  onApply,
}: FormTeamsModalProps) {
  const [draft, setDraft] = useState<DraftState>({
    step: "setup",
    playersText: "Alice\nBob\nCharlie\nDaisy\nElliot\nFiona",
    teamsText: "Team 1\nTeam 2",
    captains: {},
    available: [],
    order: [],
    pickIndex: 0,
    picks: {},
    skippedPicks: {},
  });

  if (!isOpen) return null;

  const startDraft = () => {
    const players = draft.playersText
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);

    const teamNames = draft.teamsText
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);

    if (players.length < 2 || teamNames.length < 2) return;

    // Ensure captains are selected
    let captains = { ...draft.captains };
    const usedCaps = new Set(Object.values(captains).filter(Boolean));
    let remainingForCaps = players.filter((p) => !usedCaps.has(p));

    for (const tn of teamNames) {
      if (!captains[tn]) {
        const auto = remainingForCaps.shift();
        captains[tn] = auto || "";
      }
    }

    // Remove captains from available pool
    const capSet = new Set(Object.values(captains).filter(Boolean));
    const available = players.filter((p) => !capSet.has(p));

    // Initialize picks with captains
    const picks: Record<string, string[]> = {};
    for (const tn of teamNames) {
      picks[tn] = captains[tn] ? [captains[tn]] : [];
    }

    setDraft((d) => ({
      ...d,
      step: "picking",
      captains,
      available,
      order: teamNames,
      pickIndex: 0,
      picks,
    }));
  };

  const currentDraftTeam = () => {
    if (!draft.order.length) return "";
    return draft.order[draft.pickIndex % draft.order.length];
  };

  const draftPick = (playerName: string) => {
    const tn = currentDraftTeam();
    if (!tn) return;

    setDraft((d) => {
      const available = d.available.filter((p) => p !== playerName);
      const picks = { ...d.picks, [tn]: [...(d.picks[tn] || []), playerName] };
      const nextPickIndex = d.pickIndex + 1;
      const step = available.length === 0 ? "summary" : d.step;

      return { ...d, available, picks, pickIndex: nextPickIndex, step };
    });
  };

  const skipPick = () => {
    const tn = currentDraftTeam();
    if (!tn) return;

    setDraft((d) => {
      const skippedPicks = { ...d.skippedPicks, [tn]: (d.skippedPicks[tn] || 0) + 1 };
      const nextPickIndex = d.pickIndex + 1;
      const step = d.available.length === 0 ? "summary" : d.step;

      return { ...d, skippedPicks, pickIndex: nextPickIndex, step };
    });
  };

  const applyToGame = () => {
    const teamNames = draft.order.length ? draft.order : draft.teamsText.split("\n").map((x) => x.trim()).filter(Boolean);
    const payloadTeams = teamNames.map((name) => ({
      name,
      captain: draft.captains[name] || "",
      members: draft.picks[name] || [],
    }));
    onApply(payloadTeams);
    onClose();
  };

  const btnClass = (variant: string = "primary") => {
    const base = "rounded-xl px-4 py-2 text-sm font-semibold";
    if (variant === "primary") {
      return `${base} ${isDark ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-slate-800 text-white hover:bg-slate-700"}`;
    }
    return `${base} border ${isDark ? "border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700" : "border-slate-300 bg-white text-slate-900 hover:bg-slate-100"}`;
  };

  const inputClass = `w-full rounded-xl border px-3 py-2 text-sm ${
    isDark ? "border-slate-700 bg-slate-700 text-slate-100" : "border-slate-300 bg-white text-slate-900"
  }`;

  const textareaClass = `w-full rounded-xl border px-3 py-2 text-sm ${
    isDark ? "border-slate-600 bg-slate-700 text-slate-100 placeholder-slate-400" : "border-slate-300 bg-white text-slate-900 placeholder-slate-400"
  }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div
        className={`w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl p-4 shadow-xl ${
          isDark ? "bg-slate-800" : "bg-white"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Form teams (Draft simulator)</div>
            <div className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Create teams by drafting players. Click "Apply to game" when done.
            </div>
          </div>
          <button onClick={onClose} className={btnClass("secondary")}>
            Close
          </button>
        </div>

        {/* Setup */}
        {draft.step === "setup" && (
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className={`rounded-2xl border p-4 ${isDark ? "border-slate-600 bg-slate-800" : "border-slate-200 bg-white"}`}>
              <div className="text-sm font-semibold">Player pool (one per line)</div>
              <textarea
                value={draft.playersText}
                onChange={(e) => setDraft((d) => ({ ...d, playersText: e.target.value }))}
                className={`${textareaClass} mt-2 h-56`}
              />
            </div>

            <div className={`rounded-2xl border p-4 ${isDark ? "border-slate-600 bg-slate-800" : "border-slate-200 bg-white"}`}>
              <div className="text-sm font-semibold">Teams (one per line)</div>
              <textarea
                value={draft.teamsText}
                onChange={(e) => setDraft((d) => ({ ...d, teamsText: e.target.value }))}
                className={`${textareaClass} mt-2 h-32`}
              />

              <div className="mt-4 text-sm font-semibold">Captains</div>
              <div className="mt-2 space-y-2">
                {draft.teamsText
                  .split("\n")
                  .map((x) => x.trim())
                  .filter(Boolean)
                  .map((tn) => (
                    <div key={tn} className="flex items-center gap-2">
                      <div className="w-32 text-sm">{tn}</div>
                      <input
                        value={draft.captains[tn] || ""}
                        onChange={(e) => setDraft((d) => ({ ...d, captains: { ...d.captains, [tn]: e.target.value } }))}
                        placeholder="Captain name"
                        className={inputClass}
                      />
                    </div>
                  ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={startDraft} className={btnClass("primary")}>
                  Start draft
                </button>
                <button onClick={() => setDraft((d) => ({ ...d, captains: {} }))} className={btnClass("secondary")}>
                  Clear captains
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Picking */}
        {draft.step === "picking" && (
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className={`rounded-2xl border p-4 lg:col-span-2 ${isDark ? "border-slate-600 bg-slate-800" : "border-slate-200 bg-white"}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">Available players</div>
                  <div className={`mt-1 text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                    Current pick: <span className="font-semibold">{currentDraftTeam()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={skipPick} className={btnClass("secondary")}>
                    Skip Pick
                  </button>
                  <button onClick={() => setDraft((d) => ({ ...d, step: "summary" }))} className={btnClass("secondary")}>
                    Finish early
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {draft.available.map((p) => (
                  <button
                    key={p}
                    onClick={() => draftPick(p)}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm ${
                      isDark ? "border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100" : "border-slate-300 bg-white hover:bg-slate-50 text-slate-900"
                    }`}
                  >
                    <span>{p}</span>
                    <span className={`rounded-lg px-2 py-1 text-xs font-semibold text-white ${isDark ? "bg-slate-900" : "bg-slate-800"}`}>
                      Pick
                    </span>
                  </button>
                ))}
              </div>

              {draft.available.length === 0 && (
                <div
                  className={`mt-3 rounded-xl border p-3 text-sm ${
                    isDark ? "border-slate-700 bg-slate-900 text-slate-400" : "border-slate-200 bg-slate-50 text-slate-600"
                  }`}
                >
                  No players left. Draft complete.
                </div>
              )}
            </div>

            <div className={`rounded-2xl border p-4 ${isDark ? "border-slate-600 bg-slate-800" : "border-slate-200 bg-white"}`}>
              <div className="text-sm font-semibold">Teams</div>
              <div className="mt-3 space-y-3">
                {draft.order.map((tn) => (
                  <div key={tn} className={`rounded-xl border p-3 ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-slate-50"}`}>
                    <div className="text-sm font-semibold">{tn}</div>
                    <div className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>Captain: {draft.captains[tn] || "?"}</div>
                    <div className="mt-2 text-sm">
                      {(draft.picks[tn] || []).length ? (
                        <ul className="list-disc pl-5">
                          {(draft.picks[tn] || []).map((m, idx) => (
                            <li key={idx}>{m}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className={isDark ? "text-slate-500" : "text-slate-400"}>No picks yet.</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        {draft.step === "summary" && (
          <div className="mt-4">
            <div className={`rounded-2xl border p-4 ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-slate-50"}`}>
              <div className="text-sm font-semibold">Draft summary</div>
              <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
                {draft.order.map((tn) => (
                  <div key={tn} className={`rounded-xl border p-3 ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-300 bg-white"}`}>
                    <div className="text-sm font-semibold">{tn}</div>
                    <div className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>Captain: {draft.captains[tn] || "?"}</div>
                    <div className="mt-2 text-sm">
                      {(draft.picks[tn] || []).length ? (
                        <ul className="list-disc pl-5">
                          {(draft.picks[tn] || []).map((m, idx) => (
                            <li key={idx}>{m}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className={isDark ? "text-slate-400" : "text-slate-500"}>No members.</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={applyToGame} className={btnClass("primary")}>
                Apply to game
              </button>
              <button onClick={() => setDraft((d) => ({ ...d, step: "setup" }))} className={btnClass("secondary")}>
                Back to setup
              </button>
              <button onClick={onClose} className={btnClass("secondary")}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
