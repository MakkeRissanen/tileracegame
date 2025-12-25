"use client";

import { useState, useEffect } from "react";
import { Modal, Button, inputClass } from "./ui";
import { Team, GameState, POWERUP_DEFS } from "@/types/game";

interface EditTeamModalProps {
  isOpen: boolean;
  isDark: boolean;
  team: Team;
  game: GameState;
  onClose: () => void;
  onUpdateTeam: (teamId: string, updates: Partial<Team>) => void;
}

export default function EditTeamModal({
  isOpen,
  isDark,
  team,
  game,
  onClose,
  onUpdateTeam,
}: EditTeamModalProps) {
  const [teamName, setTeamName] = useState(team.name);
  const [members, setMembers] = useState<string[]>(team.members || []);
  const [captain, setCaptain] = useState(team.captain || "");
  const [newMember, setNewMember] = useState("");
  const [position, setPosition] = useState(team.pos.toString());
  const [playerPoints, setPlayerPoints] = useState<Record<string, number>>(team.playerPoints || {});
  const [inventory, setInventory] = useState<string[]>(team.inventory || []);
  const [selectedPowerup, setSelectedPowerup] = useState("");

  // Sync state with team prop whenever modal opens or team changes
  useEffect(() => {
    if (isOpen) {
      setTeamName(team.name);
      setMembers(team.members || []);
      setCaptain(team.captain || "");
      setPosition(team.pos.toString());
      setPlayerPoints(team.playerPoints || {});
      setInventory(team.inventory || []);
      setNewMember("");
      setSelectedPowerup("");
    }
  }, [isOpen, team]);

  const handleAddMember = () => {
    if (newMember.trim() && !members.includes(newMember.trim())) {
      setMembers([...members, newMember.trim()]);
      // Initialize points for new member
      if (!playerPoints[newMember.trim()]) {
        setPlayerPoints({ ...playerPoints, [newMember.trim()]: 0 });
      }
      setNewMember("");
    }
  };

  const handleRemoveMember = (member: string) => {
    setMembers(members.filter((m) => m !== member));
    if (captain === member) {
      setCaptain(members.filter((m) => m !== member)[0] || "");
    }
    // Remove player points for removed member
    const newPoints = { ...playerPoints };
    delete newPoints[member];
    setPlayerPoints(newPoints);
  };

  const handleUpdatePlayerPoints = (player: string, points: string) => {
    const pointsValue = parseInt(points) || 0;
    setPlayerPoints({ ...playerPoints, [player]: pointsValue });
  };

  const handleAddPowerup = () => {
    if (selectedPowerup) {
      setInventory([...inventory, selectedPowerup]);
      setSelectedPowerup("");
    }
  };

  const handleRemovePowerup = (index: number) => {
    setInventory(inventory.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const updates: Partial<Team> = {
      name: teamName,
      members,
      captain: captain || members[0] || "",
      pos: parseInt(position) || team.pos,
      playerPoints,
      inventory,
    };
    onUpdateTeam(team.id, updates);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isDark={isDark}>
      <div className="space-y-6 max-h-[80vh] overflow-y-auto">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
            Edit Team: {team.name}
          </h2>
          <p className={`mt-2 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Modify team name, members, captain, position, powerups, and player points
          </p>
        </div>

        {/* Team Name */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
            Team Name
          </label>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className={inputClass(isDark)}
            placeholder="Enter team name"
          />
        </div>

        {/* Team Position */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
            Position (Tile Number)
          </label>
          <input
            type="number"
            min="1"
            max="56"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className={inputClass(isDark)}
          />
        </div>

        {/* Powerup Inventory */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
            Powerup Inventory
          </label>
          
          {/* Add Powerup */}
          <div className="flex gap-2 mb-3">
            <select
              value={selectedPowerup}
              onChange={(e) => setSelectedPowerup(e.target.value)}
              className={`flex-1 ${inputClass(isDark)}`}
            >
              <option value="">Select powerup to add</option>
              {POWERUP_DEFS.map((powerup) => (
                <option key={powerup.id} value={powerup.id}>
                  {powerup.name}
                </option>
              ))}
            </select>
            <Button 
              variant="primary" 
              isDark={isDark} 
              onClick={handleAddPowerup}
              disabled={!selectedPowerup}
            >
              Add
            </Button>
          </div>

          {/* Current Powerups */}
          {inventory.length > 0 ? (
            <div className="space-y-2">
              {inventory.map((powerupId, idx) => {
                const powerupDef = POWERUP_DEFS.find((p) => p.id === powerupId);
                return (
                  <div
                    key={idx}
                    className={`
                      flex items-center justify-between p-3 rounded-lg
                      ${isDark ? "bg-slate-700" : "bg-slate-100"}
                    `}
                  >
                    <span className={isDark ? "text-slate-200" : "text-slate-800"}>
                      ⚡ {powerupDef?.name || powerupId}
                    </span>
                    <button
                      onClick={() => handleRemovePowerup(idx)}
                      className={`text-sm px-2 py-1 rounded ${isDark ? "text-red-400 hover:bg-red-900/20" : "text-red-600 hover:bg-red-50"}`}
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              No powerups in inventory
            </p>
          )}
        </div>

        {/* Team Members */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
            Team Members
          </label>
          
          {/* Add Member Input */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newMember}
              onChange={(e) => setNewMember(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddMember()}
              placeholder="Member name"
              className={inputClass(isDark)}
            />
            <Button variant="primary" isDark={isDark} onClick={handleAddMember}>
              Add
            </Button>
          </div>

          {/* Members List */}
          {members.length > 0 ? (
            <div className="space-y-2">
              {members.map((member, idx) => (
                <div
                  key={idx}
                  className={`
                    flex items-center justify-between p-3 rounded-lg
                    ${isDark ? "bg-slate-700" : "bg-slate-100"}
                  `}
                >
                  <span className={isDark ? "text-slate-200" : "text-slate-800"}>
                    {member}
                    {member === captain && (
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded ${team.color} text-white`}>
                        Captain
                      </span>
                    )}
                  </span>
                  <button
                    onClick={() => handleRemoveMember(member)}
                    className={`text-sm px-2 py-1 rounded ${isDark ? "text-red-400 hover:bg-red-900/20" : "text-red-600 hover:bg-red-50"}`}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              No members added yet
            </p>
          )}
        </div>

        {/* Captain Selection */}
        {members.length > 0 && (
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Team Captain
            </label>
            <select
              value={captain}
              onChange={(e) => setCaptain(e.target.value)}
              className={inputClass(isDark)}
            >
              <option value="">Select Captain</option>
              {members.map((member, idx) => (
                <option key={idx} value={member}>
                  {member}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Player Points */}
        {members.length > 0 && (
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Player Points
            </label>
            <div className="space-y-2">
              {members.map((member, idx) => (
                <div
                  key={idx}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg
                    ${isDark ? "bg-slate-700" : "bg-slate-100"}
                  `}
                >
                  <span className={`flex-1 ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                    {member}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      Points:
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={playerPoints[member] || 0}
                      onChange={(e) => handleUpdatePlayerPoints(member, e.target.value)}
                      className={`w-20 ${inputClass(isDark)}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSave}
            variant="primary"
            isDark={isDark}
            className="flex-1"
          >
            Save Changes
          </Button>
          <Button
            onClick={onClose}
            variant="secondary"
            isDark={isDark}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}

