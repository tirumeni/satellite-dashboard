import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Chip — pill-shaped control used for example prompts (Landing) and the
 * editable query summary in the TopBar.
 */
interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  children: ReactNode;
}

export function Chip({ icon, children, className, ...props }: ChipProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-tight rounded-pill border border-hairline-strong",
        "bg-white/[0.04] px-std py-tight text-button-label text-text-primary",
        "transition-[color,background-color,border-color,transform,box-shadow] duration-200 hover:-translate-y-px hover:border-primary/30 hover:bg-white/[0.075] hover:shadow-[0_4px_14px_rgba(0,0,0,.16)]",
        className
      )}
      {...props}
    >
      {icon}
      <span className="min-w-0 truncate">{children}</span>
    </button>
  );
}
