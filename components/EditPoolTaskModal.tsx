"use client";

import { useState } from "react";
import { PoolTask } from "@/types/game";
import { Modal, Button, inputClass } from "./ui";

interface EditPoolTaskModalProps {
  isOpen: boolean;
  isDark: boolean;
  task: PoolTask;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<PoolTask>) => Promise<void>;
}

export default function EditPoolTaskModal({
  isOpen,
  isDark,
  task,
  onClose,
  onUpdate,
}: EditPoolTaskModalProps) {
  const [label, setLabel] = useState(task.label);
  const [instructions, setInstructions] = useState(task.instructions);
  const [image, setImage] = useState(task.image);
  const [minCompletions, setMinCompletions] = useState(task.minCompletions || 1);
  const [maxCompletions, setMaxCompletions] = useState(task.maxCompletions || 1);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(task.id, {
        label,
        instructions,
        image,
        minCompletions,
        maxCompletions,
      });
      onClose();
    } catch (err) {
      alert(`Failed to update: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isDark={isDark}>
      <div className="p-6">
        <h2 className={`text-2xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
          Edit Pool Task
        </h2>

        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className={inputClass(isDark)}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Instructions
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              className={inputClass(isDark)}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Image URL
            </label>
            <input
              type="text"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className={inputClass(isDark)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                Min Completions
              </label>
              <input
                type="number"
                value={minCompletions}
                onChange={(e) => setMinCompletions(Number(e.target.value))}
                className={inputClass(isDark)}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                Max Completions
              </label>
              <input
                type="number"
                value={maxCompletions}
                onChange={(e) => setMaxCompletions(Number(e.target.value))}
                className={inputClass(isDark)}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="secondary" isDark={isDark} onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button variant="primary" isDark={isDark} onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
