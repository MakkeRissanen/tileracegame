"use client";

import { Button, Modal } from "./ui";

interface TimeBombTriggerModalProps {
  isOpen: boolean;
  isDark: boolean;
  bomberName: string;
  fromTile: number;
  toTile: number;
  onClose: () => void;
}

export default function TimeBombTriggerModal({
  isOpen,
  isDark,
  bomberName,
  fromTile,
  toTile,
  onClose,
}: TimeBombTriggerModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isDark={isDark}>
      <div className="text-center space-y-6 py-8">
        <div className="text-6xl">💣💥</div>
        <h1 className={`text-3xl font-bold ${isDark ? "text-red-400" : "text-red-600"}`}>
          TIME BOMB TRIGGERED!
        </h1>
        <div>
          <p className={`text-xl mb-4 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
            You stepped on <span className="font-bold">{bomberName}'s</span> trap!
          </p>
          <p className={`text-lg ${isDark ? "text-red-300" : "text-red-500"}`}>
            Pushed back from <span className="font-bold">Tile {fromTile}</span> to <span className="font-bold">Tile {toTile}</span>
          </p>
        </div>
        <Button onClick={onClose} variant="primary" isDark={isDark}>
          Continue
        </Button>
      </div>
    </Modal>
  );
}
