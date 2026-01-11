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
    { id: "powerup-info", label: "Powerups & Rules", icon: "📋" },
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
              
              {/* CRITICAL RULE - Proof Requirement */}
              <div className="bg-red-900/20 border-4 border-red-600 rounded-lg p-6 my-4">
                <p className="text-red-600 dark:text-red-400 font-black text-2xl text-center leading-tight">
                  ⚠️ MANDATORY REQUIREMENT ⚠️
                </p>
                <p className="text-red-600 dark:text-red-400 font-bold text-xl text-center mt-3 leading-snug">
                  EVERY TIME YOU COMPLETE A TILE OR OBTAIN A POWERUP, YOU MUST POST A PROOF PICTURE OF THE COMPLETED TASK IN DISCORD!
                </p>
                <p className="text-red-500 dark:text-red-400 font-semibold text-lg text-center mt-2">
                  NO PROOF = NO COMPLETION
                </p>
                <div className="mt-3 space-y-2">
                  <p className="text-red-500 dark:text-red-400 font-semibold text-base text-center">
                    📅 Proof pictures MUST include:
                  </p>
                  <ul className="list-disc list-inside text-red-500 dark:text-red-400 font-semibold text-sm text-center space-y-1">
                    <li>The date visible on screen (via RuneLite plugin)</li>
                    <li>The player name receiving the completion/points</li>
                  </ul>
                </div>
                
                <div className={`mt-4 p-3 rounded-lg ${isDark ? "bg-yellow-900/30 border-yellow-600" : "bg-yellow-100 border-yellow-500"} border-2`}>
                  <p className="font-semibold mb-2 text-center">📸 "Start Check" Tiles - Special Requirement:</p>
                  <p className="mb-2 text-sm">Some tiles are marked with a <span className="px-2 py-1 rounded bg-yellow-600 text-white text-xs font-bold">START CHECK</span> badge. For these tiles:</p>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li><strong>Check your collection log BEFORE starting to grind</strong></li>
                    <li><strong>If you already have the item in your clog:</strong> Take a picture showing the quantity BEFORE you start</li>
                    <li><strong>Why?</strong> Low value items don't show in game chat, so we need proof the quantity increased</li>
                    <li><strong>Post both:</strong> The start proof showing initial quantity (if applicable) AND completion proof showing the number increased</li>
                  </ul>
                </div>
              </div>
              
              <section>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Objectives
                </h3>
                <ol className="list-decimal list-inside space-y-2">
                  <li><strong>Win the Race:</strong> Be the first team to reach tile 56 (the final tile) by completing tasks and strategically using powerups</li>
                  <li><strong>Earn Top Rankings:</strong> The top 10 players with the most points will receive rewards</li>
                </ol>
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
                  Claiming Powerups
                </h3>
                <p>When you claim a powerup tile, you earn points as specified in that powerup's instructions, in addition to receiving the powerup. Powerup tiles can have different claim types (each team once, first team only, or unlimited).</p>
              </section>

              <section>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Fog of War
                </h3>
                <p>Tiles are revealed progressively as teams advance. You can see a limited number of tiles ahead based on the farthest team's position. The first 8 tiles are revealed at game start.</p>
              </section>

              <section>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Claiming Powerups
                </h3>
                <div className={`p-3 rounded-lg ${isDark ? "bg-yellow-900/30 border-2 border-yellow-600" : "bg-yellow-100 border-2 border-yellow-600"}`}>
                  <p className="font-semibold mb-2 text-yellow-600 dark:text-yellow-400">🔒 Powerup Claiming is Locked Until Tile 5</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Teams cannot claim powerups from tiles until <strong>at least one team has completed Tile 4</strong> (reached Tile 5)</li>
                    <li>You can still view the "Claim Powerup" interface to see available powerups</li>
                    <li>All powerup tiles will show a 🔒 <strong>Unavailable</strong> status until the unlock condition is met</li>
                    <li>Once unlocked, all teams can claim powerups from any visible tile (even if they haven't personally reached Tile 5)</li>
                    <li>This prevents early-game powerup stacking and keeps the race fair</li>
                  </ul>
                </div>
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
                <p className="mb-2 font-bold text-red-600 dark:text-red-400">
                  ⚠️ Always post your proof picture in Discord BEFORE clicking "Complete Tile"
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Click "Complete Tile" on your team card</li>
                  <li>Select which player(s) completed the task</li>
                  <li><strong>Min Completions:</strong> Minimum number of players required to complete (must select at least this many)</li>
                  <li><strong>Max Completions:</strong> Maximum number of players allowed to complete (cannot select more than this)</li>
                  <li><strong>Multi-completion tiles:</strong> Unless it's a group tile, the same player can provide multiple completions</li>
                  <li><strong>⚠️ Progress resets when moving:</strong> Your progress on a tile starts when you land on it. If you get moved by a powerup (forward or backward), your progress on the new tile restarts from zero</li>
                </ul>
              </section>

              <section>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  What Counts as a Completion?
                </h3>
                <p className="mb-2">A "completion" depends on the tile type and requirements:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Item-based tiles:</strong> Obtaining ONE of the items listed on the tile (e.g., if a tile lists "Dragon Warhammer OR 60k XP Chunk", getting either one counts as a completion)</li>
                  <li><strong>XP-based tiles:</strong> A single XP chunk (example 60k XP) counts as one completion</li>
                  <li><strong>Group tiles:</strong> Each person included in the group activity counts as one completion</li>
                  <li><strong>Single-task tiles:</strong> One completion per tile unless doubled (then two completions required)</li>
                  <li><strong>Set-based tiles:</strong> If a tile requires items from a set (e.g., Oathplate set), each piece of the set can only be used once as a completion</li>
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
                    <li>Example: Hard tile doubled from 1→2 completions still awards 3 points per completion (difficulty-based)</li>
                  </ul>
                </div>
              </section>

              <section>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Tile Modifications
                </h3>
                <p>Tiles can be modified by powerups, indicated by badges:</p>
                <ul className="space-y-2 mt-2">
                  <li><span className="px-2 py-1 rounded bg-blue-600 text-white text-xs">📋</span> - Task was copied from another tile</li>
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

          {activeSection === "powerup-info" && (
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

              <h2 className={`text-2xl font-bold mt-8 ${isDark ? "text-white" : "text-slate-900"}`}>
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
                    <li>Copied tiles show a blue "📋" badge</li>
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
                </div>
              </section>

              {/* Powerup Insurance */}
              <section>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Powerup Insurance 🛡️
                </h3>
                <div className={`p-3 rounded-lg ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                  <p className="font-semibold mb-1">Type: Self powerup targeting</p>
                  <p className="text-sm mb-2">Protect one of your powerups from being stolen or disabled by other teams.</p>
                  <p className="font-semibold text-xs mb-1">Restrictions:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Must select which powerup to insure from your inventory</li>
                    <li>You must have at least one other powerup to insure</li>
                    <li>Triggers powerup cooldown</li>
                  </ul>
                  <p className="font-semibold text-xs mt-2 mb-1">Protection:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Insured powerups cannot be stolen by "Steal Powerup"</li>
                    <li>Insured powerups cannot be removed by "Disable Powerup"</li>
                    <li>Insurance is permanent - protects the powerup until it's used</li>
                    <li>Insurance badge (🛡️) shown in inventory</li>
                  </ul>
                </div>
              </section>

              {/* Time Bomb */}
              <section>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Time Bomb 💣
                </h3>
                <div className={`p-3 rounded-lg ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                  <p className="font-semibold mb-1">Type: Trap placement (current tile)</p>
                  <p className="text-sm mb-2">Place a hidden bomb on your current tile. The next team to land on this tile gets pushed back 2 tiles.</p>
                  <p className="font-semibold text-xs mb-1">How It Works:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Can only be placed by <strong>sacrificing 3 powerups</strong> from your inventory</li>
                    <li><strong>Automatically insured (🛡️)</strong> - cannot be stolen or disabled</li>
                    <li>Bomb is placed on your current tile when you use it</li>
                    <li>When triggered, victim is pushed back 2 tiles and bomb is removed</li>
                    <li><strong>ALL teams are notified in Discord</strong> when bomb is triggered</li>
                  </ul>
                  <p className="font-semibold text-xs mt-2 mb-1">Restrictions:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Requires 3 powerups to sacrifice</li>
                    <li>Cannot place on tile 1 or the final tile</li>
                    <li>Only one bomb per tile (cannot stack multiple bombs)</li>
                    <li>Triggers powerup cooldown</li>
                  </ul>
                  <p className="font-semibold text-xs mt-2 mb-1">🔒 Complete Secrecy:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li><strong>NO ONE can see the bomb</strong> - not even admins</li>
                    <li>The bomb is tied to the <strong>tile number itself</strong>, not the task content</li>
                    <li>Admins cannot detect bombs by editing tiles</li>
                    <li>Only the planter sees a private notification when placing</li>
                    <li>Only the victim and planter know when the bomb triggers</li>
                    <li><strong>No one else knows you have this powerup</strong> - sacrificing and claiming happens in complete secrecy</li>
                    <li><strong>Coordinate with your team in private channels</strong> to plan bomb placements strategically</li>
                    <li>This ensures complete strategic surprise</li>
                  </ul>
                  <p className="font-semibold text-xs mt-2 mb-1">Special Mechanics:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li><strong>Protected:</strong> Time bombs cannot be stolen or disabled by enemies</li>
                    <li>Bomb only affects the next team - you are immune to your own bombs</li>
                    <li>Bomb persists until triggered (doesn't expire)</li>
                    <li>If victim would go below tile 1, they stop at tile 1</li>
                    <li>Bomb visibility: only bomb placer sees the 💣 marker</li>
                  </ul>
                </div>
              </section>

              {/* Steal Powerup */}
              <section>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Steal Powerup
                </h3>
                <div className={`p-3 rounded-lg ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                  <p className="font-semibold mb-1">Type: Target team + target powerup</p>
                  <p className="text-sm mb-2">Choose another team and steal one of their stored powerups, adding it to your inventory.</p>
                  <p className="font-semibold text-xs mb-1">Restrictions:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li><strong>Can only target teams AHEAD of you</strong> (higher tile position)</li>
                    <li>Must select a target team</li>
                    <li>Must select which powerup to steal from their inventory</li>
                    <li>Target team must have at least one powerup</li>
                    <li><strong>Cannot steal insured powerups (🛡️)</strong></li>
                    <li>Triggers powerup cooldown</li>
                  </ul>
                </div>
              </section>

              {/* Cooldown Lock */}
              <section>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Cooldown Lock 🔒
                </h3>
                <div className={`p-3 rounded-lg ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                  <p className="font-semibold mb-1">Type: Target team</p>
                  <p className="text-sm mb-2">Choose another team and extend their powerup cooldown by +2 tiles.</p>
                  <p className="font-semibold text-xs mb-1">How It Works:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Adds 2 tiles to target's cooldown counter</li>
                    <li>If target has no cooldown, they now need to complete 2 tiles before using powerups</li>
                    <li>If target already has cooldown, it increases (e.g., 1 tile → 3 tiles)</li>
                    <li>Cooldown decreases by 1 per tile completion</li>
                  </ul>
                  <p className="font-semibold text-xs mt-2 mb-1">Restrictions:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Must select a target team</li>
                    <li>Cannot target yourself</li>
                    <li>Triggers powerup cooldown</li>
                  </ul>
                </div>
              </section>

              {/* Randomize Random Tile */}
              <section>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Randomize Random Tile 🎲
                </h3>
                <div className={`p-3 rounded-lg ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                  <p className="font-semibold mb-1">Type: Board modification (random targeting)</p>
                  <p className="text-sm mb-2">Randomly selects one tile on the board and changes it to a random task from ANY difficulty pool. The tile's difficulty can change!</p>
                  <p className="font-semibold text-xs mb-1">✅ Can Target:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Clean, unmodified tiles only</li>
                    <li>Any tile from #2 to #55 (excluding tile 1 and final tile)</li>
                    <li>Tiles at or ahead of the farthest team's position</li>
                    <li>Tiles that are visible (not hidden by fog of war)</li>
                  </ul>
                  <p className="font-semibold text-xs mt-2 mb-1">❌ Cannot Target:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Tile 1 (starting tile)</li>
                    <li>Final tile (56) - cannot be randomized</li>
                    <li>Already altered tiles (copied, changed, or doubled)</li>
                    <li>Tiles with teams standing on them</li>
                    <li>Tiles behind the farthest team</li>
                    <li>Tiles hidden by fog of war</li>
                  </ul>
                  <p className="font-semibold text-xs mt-2 mb-1">Special Mechanics:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li><strong>Target is selected completely randomly</strong> - you don't choose</li>
                    <li><strong>Difficulty can change!</strong> Replacement task is random from ANY difficulty pool (easy/medium/hard)</li>
                    <li>Can use any task - even tasks already used elsewhere on the board</li>
                    <li>Does NOT mark task as "used" - same task can appear multiple times</li>
                    <li>Shows purple 🔄 badge (treated as "changed" tile)</li>
                    <li>Cannot be changed or modified again after randomization</li>
                    <li>Triggers powerup cooldown</li>
                  </ul>
                </div>
              </section>

              {/* Mystery Powerup */}
              <section>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Mystery Powerup 🎁
                </h3>
                <div className={`p-3 rounded-lg ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                  <p className="font-semibold mb-1">Type: Lootbox (random reward)</p>
                  <p className="text-sm mb-2">Open a mystery box to receive one random powerup from a curated pool.</p>
                  <p className="font-semibold text-xs mb-1">Possible Rewards:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Skip +1</li>
                    <li>Send Back 1</li>
                    <li>Powerup Insurance</li>
                    <li>Steal Powerup</li>
                    <li>Cooldown Lock</li>
                    <li>Randomize Random Tile</li>
                    <li>Clear Cooldown</li>
                  </ul>
                  <p className="font-semibold text-xs mt-2 mb-1">How It Works:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Randomly selects one powerup from the reward pool</li>
                    <li>Consumes the Mystery Powerup</li>
                    <li>Adds the reward to your inventory immediately</li>
                    <li>Popup notification shows what you received</li>
                    <li>Does NOT trigger powerup cooldown</li>
                  </ul>
                </div>
              </section>

              {/* Tile Targeting Rules Summary */}
              <section className="mt-8 pt-8 border-t-2 border-slate-600">
                <h2 className={`text-2xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Tile Targeting Rules Summary
                </h2>

                <div className="space-y-4">
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
                      <li>Copy FROM doubled tile → Paste elsewhere (task only, NOT the doubling effect)</li>
                    </ul>
                    <p><strong>Not Allowed:</strong></p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Copy and Paste + Change Tile</li>
                      <li>Same powerup type twice on one tile</li>
                      <li>Any modification to doubled tiles</li>
                    </ul>
                  </section>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
