"use client";

import { Button, Modal } from "./ui";
import { Team } from "@/types/game";

interface VictoryModalProps {
  isOpen: boolean;
  isDark: boolean;
  winningTeam: Team;
  onClose: () => void;
}

export default function VictoryModal({
  isOpen,
  isDark,
  winningTeam,
  onClose,
}: VictoryModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isDark={isDark}>
      <div className="text-center space-y-6 py-8">
        <div className="text-6xl">🏆🎉</div>
        <h1 className={`text-4xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
          GAME OVER!
        </h1>
        <div>
          <p className={`text-2xl font-semibold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
            {winningTeam.name} completed the Final Tile!
          </p>
          <p className={`text-lg ${isDark ? "text-slate-300" : "text-slate-700"}`}>
            {winningTeam.members.join(", ")} {winningTeam.members.length === 1 ? "is" : "are"} the WINNER{winningTeam.members.length === 1 ? "" : "S"}!
          </p>
        </div>
        <Button onClick={onClose} variant="primary" isDark={isDark}>
          Close
        </Button>
      </div>
    </Modal>
  );
}
