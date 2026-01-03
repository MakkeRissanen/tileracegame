"use client";

import { Button, Modal } from "./ui";
import { powerupLabel } from "@/lib/gameUtils";

interface MysteryPowerupResultModalProps {
  isOpen: boolean;
  isDark: boolean;
  rewardPowerupId: string | null;
  onClose: () => void;
}

export default function MysteryPowerupResultModal({
  isOpen,
  isDark,
  rewardPowerupId,
  onClose,
}: MysteryPowerupResultModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isDark={isDark}>
      <div className="text-center space-y-6 py-8">
        <div className="text-6xl">🎁✨</div>
        <h1 className={`text-3xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
          Mystery Powerup Revealed!
        </h1>
        <div>
          <p className={`text-xl mb-4 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
            You received:
          </p>
          <p className={`text-2xl font-bold ${isDark ? "text-green-400" : "text-green-600"}`}>
            {rewardPowerupId ? powerupLabel(rewardPowerupId) : ""}
          </p>
        </div>
        <Button onClick={onClose} variant="primary" isDark={isDark}>
          Awesome!
        </Button>
      </div>
    </Modal>
  );
}
