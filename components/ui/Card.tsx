"use client";

import { ReactNode } from "react";
import { cardClass } from "./styles";

interface CardProps {
  isDark: boolean;
  children: ReactNode;
  className?: string;
}

export function Card({ isDark, children, className = "" }: CardProps) {
  return <div className={cardClass(isDark, className)}>{children}</div>;
}
