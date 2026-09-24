import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Card — the standard grounded (solid, non-glass) surface used for
 * Query Interpretation, AI Summary, Before/After container, etc.
 * See Visual Design System §3 "Card Design".
 */
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div className={cn("surface-card p-section", className)} {...props}>
      {children}
    </div>
  );
}

interface CardLabelProps {
  children: ReactNode;
  className?: string;
}

/** 11px uppercase micro-label used for field labels inside cards (e.g. "LOCATION"). */
export function CardLabel({ children, className }: CardLabelProps) {
  return (
    <p className={cn("text-label-micro font-semibold uppercase tracking-[.075em] text-text-muted", className)}>
      {children}
    </p>
  );
}

interface CardValueProps {
  children: ReactNode;
  className?: string;
}

/** 16px semibold value text used under a CardLabel. */
export function CardValue({ children, className }: CardValueProps) {
  return (
    <p className={cn("text-base font-semibold tracking-[-.01em] text-text-primary", className)}>
      {children}
    </p>
  );
}
