"use client";

import { ReactNode, useState, useEffect, useRef } from "react";
import { btnClass } from "./styles";

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
  const modalContentRef = useRef<HTMLDivElement>(null);

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

  // Reset scroll to top whenever modal opens or children change
  useEffect(() => {
    if (isOpen && modalContentRef.current) {
      modalContentRef.current.scrollTop = 0;
    }
  }, [isOpen, children]);

  if (!shouldRender) return null;
  
  return (
    <div
      className={`fixed inset-0 ${zIndex} flex items-center justify-center bg-black/30 p-4 transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        ref={modalContentRef}
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
