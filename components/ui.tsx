"use client";

import { ReactNode, useState, useEffect } from "react";

export function btnClass(
  variant: "primary" | "secondary" | "danger" | "ghost",
  isDark: boolean,
  extraClasses: string = ""
): string {
  const base = "rounded-xl border px-3 py-2 text-sm font-semibold transition-colors";
  const variants = {
    primary: isDark
      ? "bg-slate-900 text-white hover:bg-slate-800 border-slate-900"
      : "bg-slate-800 text-white hover:bg-slate-700 border-slate-800",
    secondary: isDark
      ? "border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700"
      : "border-slate-300 bg-white text-slate-900 hover:bg-slate-100",
    danger: isDark
      ? "border-red-900 bg-red-900/20 text-red-400 hover:bg-red-900/30"
      : "border-red-300 bg-red-50 text-red-700 hover:bg-red-100",
    ghost: isDark
      ? "border-slate-600 bg-slate-700 hover:bg-slate-600 text-white"
      : "bg-slate-200 hover:bg-slate-300 text-slate-900 border-slate-200",
  };
  return `${base} ${variants[variant]} ${extraClasses}`;
}

export function inputClass(isDark: boolean, extraClasses: string = ""): string {
  const base = "w-full rounded-xl px-3 py-2 text-sm";
  const style = isDark
    ? "bg-slate-800 text-slate-100 placeholder-slate-400 border border-slate-600"
    : "bg-white text-slate-900 placeholder-slate-400 border border-slate-300";
  return `${base} ${style} ${extraClasses}`;
}

export function selectClass(isDark: boolean, extraClasses: string = ""): string {
  const base = "w-full rounded-xl px-3 py-2 text-sm";
  const style = isDark
    ? "bg-slate-800 text-slate-100 border-2 border-slate-600"
    : "bg-white text-slate-900 border-2 border-slate-300";
  return `${base} ${style} ${extraClasses}`;
}

export function textareaClass(isDark: boolean, extraClasses: string = ""): string {
  const base = "w-full rounded-xl border px-3 py-2 text-sm";
  const style = isDark
    ? "border-slate-600 bg-slate-700 text-slate-100 placeholder-slate-400"
    : "border-slate-300 bg-white text-slate-900 placeholder-slate-400";
  return `${base} ${style} ${extraClasses}`;
}

export function cardClass(isDark: boolean, extraClasses: string = ""): string {
  const base = "rounded-2xl border p-4 shadow-sm";
  const style = isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white";
  return `${base} ${style} ${extraClasses}`;
}

export function textMuted(isDark: boolean): string {
  return isDark ? "text-slate-400" : "text-slate-600";
}

export function textNormal(isDark: boolean): string {
  return isDark ? "text-slate-300" : "text-slate-600";
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  isDark: boolean;
  maxWidth?: string;
  zIndex?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  isDark,
  maxWidth = "max-w-3xl",
  zIndex = "z-50",
}: ModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small delay to trigger animation
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      // Wait for animation to complete before unmounting
      const timer = setTimeout(() => setShouldRender(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;
  
  return (
    <div
      className={`fixed inset-0 ${zIndex} flex items-center justify-center bg-black/30 p-4 transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-2xl p-4 shadow-xl transition-all duration-200 ${
          isDark ? "bg-slate-800 dark-scrollbar" : "bg-white"
        } ${
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            {title && (
              <div className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                {title}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className={btnClass("secondary", isDark, "hover:opacity-80")}
          >
            Close
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

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

interface CardProps {
  isDark: boolean;
  children: ReactNode;
  className?: string;
}

export function Card({ isDark, children, className = "" }: CardProps) {
  return <div className={cardClass(isDark, className)}>{children}</div>;
}
