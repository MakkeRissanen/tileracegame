"use client";

import { Button, inputClass, Modal } from "./ui";

interface AdminLoginModalProps {
  isOpen: boolean;
  isDark: boolean;
  onClose: () => void;
  onLogin: (password: string) => void;
}

export default function AdminLoginModal({
  isOpen,
  isDark,
  onClose,
  onLogin,
}: AdminLoginModalProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    onLogin(password);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isDark={isDark}>
      <div className="space-y-4">
        <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
          Admin Login
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Admin Password
            </label>
            <input
              type="password"
              name="password"
              className={inputClass(isDark)}
              placeholder="Enter admin password"
              required
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="primary" isDark={isDark} className="flex-1">
              Login
            </Button>
            <Button
              type="button"
              variant="secondary"
              isDark={isDark}
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
