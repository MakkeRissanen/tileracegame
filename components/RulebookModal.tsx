"use client";

import { useState } from "react";
import { Modal } from "./ui";

interface RulebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

export default function RulebookModal({ isOpen, onClose, isDark }: RulebookModalProps) {
  const [activeSection, setActiveSection] = useState<string>("overview");

  const sections = [
    { id: "overview", label: "Game Overview", icon: "🎮" },
    { id: "tiles", label: "Tile System", icon: "🎯" },
    { id: "powerups", label: "Powerup Mechanics", icon: "⚡" },
    { id: "powerup-info", label: "Powerup Reference", icon: "📋" },
    { id: "restrictions", label: "Tile Targeting Rules", icon: "🚫" },
    { id: "strategy", label: "Strategy Tips", icon: "💡" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} isDark={isDark} maxWidth="max-w-5xl" title="📖 Game Rulebook">
      <div className="flex gap-4" style={{ maxHeight: "70vh" }}>
        {/* Sidebar Navigation */}
        <div className="flex-shrink-0 w-48 space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`
                w-full px-3 py-2 rounded-lg text-left text-sm font-medium transition-colors
                ${
                  activeSection === section.id
                    ? isDark
                      ? "bg-blue-900/50 text-blue-200"
                      : "bg-blue-100 text-blue-900"
                    : isDark
                    ? "text-slate-300 hover:bg-slate-800"
                    : "text-slate-700 hover:bg-slate-100"
                }
              `}
            >
              {section.icon} {section.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div
          className={`flex-1 overflow-y-auto pr-2 space-y-4 ${
            isDark ? "text-slate-300" : "text-slate-700"
          }`}
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: isDark ? "#475569 #1e293b" : "#cbd5e1 #f1f5f9",
          }}
        >
          {activeSection === "overview" && (
            <div className="space-y-4">
              <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                Game Overview
              </h2>
              
              <section>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Objective
                </h3>
                <p>Be the first team to reach tile 56 (the final tile) by completing tasks and strategically using powerups.</p>
              </section>

              <section>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  How to Play
                </h3>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Complete the task on your current tile to advance</li>
                  <li>Claim powerup tiles by completing their tasks</li>
                  <li>Use powerups strategically to help yourself or hinder opponents</li>
                  <li>Navigate through 56 tiles with varying difficulties</li>
                </ol>
              </section>

              <section>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Tile Difficulties
                </h3>
                <ul className="space-y-2">
                  <li><span className="px-2 py-1 rounded bg-emerald-800 text-white text-xs font-bold">Easy</span> - Basic tasks, worth 1 point (per player if single completion)</li>
                  <li><span className="px-2 py-1 rounded bg-amber-800 text-white text-xs font-bold">Medium</span> - Moderate tasks, worth 2 points (per player if single completion)</li>
                  <li><span className="px-2 py-1 rounded bg-purple-800 text-white text-xs font-bold">Hard</span> - Challenging tasks, worth 3 points (per player if single completion)</li>
                </ul>
                <p className="text-sm mt-2 italic">
                  <strong>Exception:</strong> Multi-completion tiles (maxCompletions &gt; 1) award 1 point per completion regardless of difficulty.
                </p>
              </section>

              <section>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Fog of War
                </h3>
                <p>Tiles are revealed progressively as teams advance. You can see a limited number of tiles ahead based on the farthest team's position.</p>
              </section>
            </div>
          )}

          {activeSection === "tiles" && (
            <div className="space-y-4">
              <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                Tile System
              </h2>

              <section>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Completing Tiles
                </h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Click "Complete Tile" on your team card</li>
                  <li>Select which player(s) completed the task</li>
                  <li><strong>Min Completions:</strong> Minimum number of players required to complete (must select at least this many)</li>
                  <li><strong>Max Completions:</strong> Maximum number of players allowed to complete (cannot select more than this)</li>
                </ul>
              </section>

              <section>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Point System
                </h3>
                <div className={`p-3 rounded-lg ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                  <p className="font-semibold mb-2">Single Completion Tiles (maxCompletions = 1):</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Easy: 1 point per player</li>
                    <li>Medium: 2 points per player</li>
                    <li>Hard: 3 points per player</li>
                  </ul>
                  <p className="font-semibold mt-3 mb-2">Multi-Completion Tiles (maxCompletions &gt; 1):</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Always 1 point per completion, regardless of difficulty</li>
                    <li>Difficulty-based points are not used for fairness</li>
                  </ul>
                  <p className="font-semibold mt-3 mb-2">Doubled Tiles Exception:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>If a tile was originally single completion (maxCompletions = 1) and then doubled, it still uses difficulty-based points</li>
                    <li>Example: Easy tile doubled from 1→2 completions still awards 1 point per player (difficulty-based)</li>
                  </ul>
                </div>
              </section>

              <section>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Tile Modifications
                </h3>
                <p>Tiles can be modified by powerups, indicated by badges:</p>
                <ul className="space-y-2 mt-2">
                  <li><span className="px-2 py-1 rounded bg-blue-600 text-white text-xs">Copied</span> - Task was copied from another tile</li>
                  <li><span className="px-2 py-1 rounded bg-purple-600 text-white text-xs">🔄</span> - Task was changed from pool</li>
                  <li><span className="px-2 py-1 rounded bg-orange-600 text-white text-xs font-bold">2×</span> - Completion requirement doubled</li>
                </ul>
              </section>

              <section>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Special Tiles
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Final Tile (56):</strong> Always hard difficulty, cannot be modified</li>
                  <li><strong>Reward Tiles:</strong> Grant a powerup when completed</li>
                  <li><strong>Pre-cleared Tiles:</strong> Can be skipped automatically (from certain powerups)</li>
                </ul>
              </section>

              <section>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Powerup Cooldown
                </h3>
                <p>After using a powerup, you cannot use another until you complete your next tile (unless you use the "Clear Cooldown" powerup).</p>
              </section>
            </div>
          )}

          {activeSection === "powerups" && (
            <div className="space-y-4">
              <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                Powerup Mechanics
              </h2>

              <section>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Movement Powerups
                </h3>
                <ul className="space-y-2">
                  <li><strong>Skip 1/2/3 Tiles:</strong> Move forward instantly without completing tasks</li>
                  <li><strong>Back 1/2/3 Tiles:</strong> Push another team backward</li>
                </ul>
              </section>

              <section>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Tile Modification Powerups
                </h3>
                <ul className="space-y-2">
                  <li><strong>Copy and Paste Current Tile:</strong> Copy your current task to another tile (equal or lower difficulty). Can copy FROM doubled tiles (retaliate mechanic).</li>
                  <li><strong>Change Tile:</strong> Replace a tile's task with a different one from the same difficulty pool</li>
                  <li><strong>Double Tile:</strong> Make a tile require twice as many completions (easy/medium/hard specific)</li>
                </ul>
              </section>

              <section>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Strategic Powerups
                </h3>
                <ul className="space-y-2">
                  <li><strong>Clear Cooldown:</strong> Remove powerup cooldown, use another powerup immediately</li>
                  <li><strong>Disable Powerup:</strong> Remove a stored powerup from another team's inventory</li>
                  <li><strong>Double Powerup:</strong> Duplicate one of your stored powerups</li>
                </ul>
              </section>

              <section>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Claiming Powerup Tiles
                </h3>
                <p>Powerup tiles have different claim types:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li><strong>Each Team:</strong> Every team can claim it once</li>
                  <li><strong>First Team:</strong> Only the first team to claim gets it</li>
                  <li><strong>Unlimited:</strong> Any team can claim it multiple times</li>
                </ul>
              </section>
            </div>
          )}

          {activeSection === "powerup-info" && (
            <div className="space-y-4">
              <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                Complete Powerup Reference
              </h2>
              <p className="text-sm italic">Click on powerup names in-game to see descriptions</p>

              {/* Skip Powerups */}
              <section>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Skip 1/2/3 Tiles
                </h3>
                <div className={`p-3 rounded-lg ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                  <p className="font-semibold mb-1">Type: Self-targeting</p>
                  <p className="text-sm mb-2">Instantly move your team forward by 1, 2, or 3 tiles without completing any tasks.</p>
                  <p className="font-semibold text-xs mb-1">Restrictions:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Cannot skip past tile 56 (will land on 56 if skip would go beyond)</li>
                    <li>Triggers powerup cooldown</li>
                    <li>Does not grant points or powerup rewards from skipped tiles</li>
                  </ul>
                </div>
              </section>

              {/* Back Powerups */}
              <section>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Back 1/2/3 Tiles
                </h3>
                <div className={`p-3 rounded-lg ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                  <p className="font-semibold mb-1">Type: Target team</p>
                  <p className="text-sm mb-2">Choose another team and move them backward by 1, 2, or 3 tiles.</p>
                  <p className="font-semibold text-xs mb-1">Restrictions:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Must select a target team</li>
                    <li>Cannot push a team below tile 1 (will stop at tile 1)</li>
                    <li>Triggers powerup cooldown</li>
                  </ul>
                </div>
              </section>

              {/* Copy and Paste */}
              <section>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Copy and Paste Current Tile
                </h3>
                <div className={`p-3 rounded-lg ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                  <p className="font-semibold mb-1">Type: Tile modification (future targeting)</p>
                  <p className="text-sm mb-2">Copy the task from your current tile to another tile. The target tile's difficulty may increase.</p>
                  <p className="font-semibold text-xs mb-1">✅ Can Target:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Clean, unmodified tiles</li>
                    <li>Tiles of <strong>equal or lower</strong> difficulty than your current tile</li>
                    <li>Revealed tiles (not hidden by fog of war)</li>
                  </ul>
                  <p className="font-semibold text-xs mt-2 mb-1">❌ Cannot Target:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Your current tile</li>
                    <li>Tiles with <strong>higher</strong> difficulty (can only paste to equal/lower)</li>
                    <li>Tiles with teams standing on them</li>
                    <li>Tiles with reward powerups</li>
                    <li>Already changed tiles</li>
                    <li>Doubled tiles (as paste target)</li>
                    <li>Hidden tiles</li>
                  </ul>
                  <p className="font-semibold text-xs mt-2 mb-1">Special Mechanics:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li><strong>Retaliate:</strong> Can copy FROM doubled tiles to spread difficulty elsewhere</li>
                    <li>Copied tiles show a blue "Copied" badge</li>
                    <li>Pasting preserves maxCompletions from source tile</li>
                    <li>Target tile inherits source difficulty (may upgrade easy→medium, etc.)</li>
                  </ul>
                </div>
              </section>

              {/* Change Tile */}
              <section>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Change Tile
                </h3>
                <div className={`p-3 rounded-lg ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                  <p className="font-semibold mb-1">Type: Tile modification (pool swap)</p>
                  <p className="text-sm mb-2">Replace a tile's task with a different unused task from the same difficulty pool.</p>
                  <p className="font-semibold text-xs mb-1">✅ Can Target:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Clean, unmodified tiles only</li>
                    <li>Revealed tiles</li>
                  </ul>
                  <p className="font-semibold text-xs mt-2 mb-1">❌ Cannot Target:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Final tile (56) - cannot be changed</li>
                    <li>Tiles with teams on them</li>
                    <li>Already changed tiles (can only change once)</li>
                    <li>Copied tiles</li>
                    <li>Doubled tiles</li>
                    <li>Hidden tiles</li>
                  </ul>
                  <p className="font-semibold text-xs mt-2 mb-1">Special Mechanics:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Must select a replacement task from available pool</li>
                    <li>Only shows unused tasks from the pool</li>
                    <li>Changed tiles show a purple 🔄 badge</li>
                    <li>Difficulty remains the same</li>
                  </ul>
                </div>
              </section>

              {/* Double Tile Powerups */}
              <section>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Double Tile (Easy/Medium/Hard)
                </h3>
                <div className={`p-3 rounded-lg ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                  <p className="font-semibold mb-1">Type: Tile modification (requirement doubler)</p>
                  <p className="text-sm mb-2">Make a tile require twice as many completions. Must match difficulty (doubleEasy only works on easy tiles, etc.).</p>
                  <p className="font-semibold text-xs mb-1">✅ Can Target:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Tiles matching the powerup difficulty level</li>
                    <li>Copied tiles (can double after copying)</li>
                    <li>Changed tiles (can double after changing)</li>
                    <li>Revealed tiles</li>
                  </ul>
                  <p className="font-semibold text-xs mt-2 mb-1">❌ Cannot Target:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Final tile (56) - cannot be doubled</li>
                    <li>Already doubled tiles (can only double once)</li>
                    <li>Tiles with teams on them</li>
                    <li>Wrong difficulty tiles (doubleEasy can't target medium/hard)</li>
                    <li>Hidden tiles</li>
                  </ul>
                  <p className="font-semibold text-xs mt-2 mb-1">Special Mechanics:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Doubled tiles show orange "2×" badge</li>
                    <li>Both maxCompletions and minCompletions are doubled</li>
                    <li><strong>LOCKS TILE:</strong> Once doubled, tile cannot be copied to, changed, or doubled again</li>
                    <li>Can still be copied FROM (retaliate mechanic)</li>
                    <li>Point calculation preserved from original (if originally maxCompletions=1, uses difficulty-based points)</li>
                  </ul>
                </div>
              </section>

              {/* Clear Cooldown */}
              <section>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Clear Cooldown
                </h3>
                <div className={`p-3 rounded-lg ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                  <p className="font-semibold mb-1">Type: Self-targeting</p>
                  <p className="text-sm mb-2">Remove the powerup cooldown restriction, allowing you to use another powerup immediately.</p>
                  <p className="font-semibold text-xs mb-1">Restrictions:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Can only be used when cooldown is active</li>
                    <li>Does not trigger cooldown itself (can chain multiple powerups)</li>
                  </ul>
                  <p className="font-semibold text-xs mt-2 mb-1">Strategy:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Use for powerup combos (e.g., Skip + Clear + Skip)</li>
                    <li>Essential for rapid offensive/defensive plays</li>
                  </ul>
                </div>
              </section>

              {/* Disable Powerup */}
              <section>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Disable Powerup
                </h3>
                <div className={`p-3 rounded-lg ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                  <p className="font-semibold mb-1">Type: Target team + target powerup</p>
                  <p className="text-sm mb-2">Choose another team and remove one of their stored powerups from their inventory.</p>
                  <p className="font-semibold text-xs mb-1">Restrictions:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Must select a target team</li>
                    <li>Must select which powerup to disable from their inventory</li>
                    <li>Target team must have at least one powerup</li>
                    <li>Triggers powerup cooldown</li>
                  </ul>
                </div>
              </section>

              {/* Double Powerup */}
              <section>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Double Powerup
                </h3>
                <div className={`p-3 rounded-lg ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                  <p className="font-semibold mb-1">Type: Self powerup targeting</p>
                  <p className="text-sm mb-2">Duplicate one of your stored powerups, giving you two of the same powerup.</p>
                  <p className="font-semibold text-xs mb-1">Restrictions:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Must select which powerup to duplicate from your inventory</li>
                    <li>You must have at least one other powerup to duplicate</li>
                    <li>Triggers powerup cooldown</li>
                  </ul>
                  <p className="font-semibold text-xs mt-2 mb-1">Strategy:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Duplicate rare/powerful powerups</li>
                    <li>Cannot double "Double Powerup" itself (select from other powerups)</li>
                  </ul>
                </div>
              </section>
            </div>
          )}

          {activeSection === "restrictions" && (
            <div className="space-y-4">
              <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                Tile Targeting Rules Summary
              </h2>
              <p className="text-sm italic">See "Powerup Reference" tab for complete powerup details</p>

              <section>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Copy and Paste Rules
                </h3>
                <div className={`p-3 rounded-lg ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                  <p className="font-semibold mb-2">✅ Can Target:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Clean tiles (no modifications)</li>
                    <li>Tiles of equal or lower difficulty than your current tile</li>
                    <li>Can copy FROM doubled tiles (retaliate!)</li>
                  </ul>
                  <p className="font-semibold mt-3 mb-2">❌ Cannot Target:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Tiles with teams standing on them</li>
                    <li>Your current tile</li>
                    <li>Higher difficulty tiles</li>
                    <li>Tiles with reward powerups</li>
                    <li>Changed tiles</li>
                    <li>Doubled tiles (as paste target)</li>
                  </ul>
                </div>
              </section>

              <section>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Change Tile Rules
                </h3>
                <div className={`p-3 rounded-lg ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                  <p className="font-semibold mb-2">✅ Can Target:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Unmodified tiles (not copied, changed, or doubled)</li>
                  </ul>
                  <p className="font-semibold mt-3 mb-2">❌ Cannot Target:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Final tile (56)</li>
                    <li>Tiles with teams on them</li>
                    <li>Already changed tiles</li>
                    <li>Copied tiles</li>
                    <li>Doubled tiles</li>
                  </ul>
                </div>
              </section>

              <section>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Double Tile Rules
                </h3>
                <div className={`p-3 rounded-lg ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                  <p className="font-semibold mb-2">✅ Can Target:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Tiles matching the powerup difficulty</li>
                    <li>Copied tiles</li>
                    <li>Changed tiles</li>
                  </ul>
                  <p className="font-semibold mt-3 mb-2">❌ Cannot Target:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Final tile (56)</li>
                    <li>Already doubled tiles</li>
                    <li>Tiles with teams on them</li>
                  </ul>
                  <p className="text-sm mt-3 font-semibold text-amber-500">⚠️ Once doubled, tiles are locked from all modifications!</p>
                </div>
              </section>

              <section>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Stacking Rules
                </h3>
                <p><strong>Allowed:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-sm mb-2">
                  <li>Change Tile + Double Tile</li>
                  <li>Copy and Paste → then later Double Tile</li>
                  <li>Copy FROM doubled tile → Paste elsewhere</li>
                </ul>
                <p><strong>Not Allowed:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Copy and Paste + Change Tile</li>
                  <li>Same powerup type twice on one tile</li>
                  <li>Any modification to doubled tiles</li>
                </ul>
              </section>
            </div>
          )}

          {activeSection === "strategy" && (
            <div className="space-y-4">
              <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                Strategy Tips
              </h2>

              <section>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Early Game
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Focus on claiming powerup tiles before opponents</li>
                  <li>Build a diverse powerup inventory</li>
                  <li>Save movement powerups for critical moments</li>
                </ul>
              </section>

              <section>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Mid Game
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Use Copy and Paste on your easier current tiles to simplify future paths</li>
                  <li>Consider doubling tiles ahead of opponents</li>
                  <li>Use Back powerups to slow down leaders</li>
                  <li>Build up Clear Cooldown powerups for powerup chains</li>
                </ul>
              </section>

              <section>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Late Game
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Save Skip powerups for final push</li>
                  <li>Watch for doubled tiles and plan routes around them</li>
                  <li>Consider copying doubled tiles to mess with trailing teams</li>
                  <li>Chain Clear Cooldown with multiple powerups for combos</li>
                </ul>
              </section>

              <section>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Advanced Tactics
                </h3>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Retaliate Mechanic:</strong> If someone doubles a tile you need, copy it FROM that doubled tile to spread the difficulty elsewhere</li>
                  <li><strong>Powerup Combos:</strong> Use Clear Cooldown to chain multiple powerups in succession</li>
                  <li><strong>Defensive Doubling:</strong> Double tiles behind you to slow down catching teams</li>
                  <li><strong>Task Pool Strategy:</strong> Change tiles strategically when you know easier tasks exist in the pool</li>
                  <li><strong>Timing:</strong> Save powerful powerups for when opponents are most vulnerable</li>
                </ul>
              </section>

              <section>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Team Coordination
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Assign different players to different difficulty tiles based on skill</li>
                  <li>Share points strategically to level up all team members</li>
                  <li>Coordinate powerup usage for maximum impact</li>
                </ul>
              </section>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
