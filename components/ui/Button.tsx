"use client";

import { ReactNode } from "react";
import { btnClass } from "./styles";

interface ButtonProps {
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  isDark: boolean;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
}

export function Button({
  onClick,
  variant = "secondary",
  isDark,
  children,
  disabled = false,
  className = "",
  type = "button",
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${btnClass(variant, isDark, className)} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {children}
    </button>
  );
}
