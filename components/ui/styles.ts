/**
 * Reusable style utility functions for consistent theming across components
 */

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
