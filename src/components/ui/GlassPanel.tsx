import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * GlassPanel — the shared glassmorphism surface. See Visual Design System
 * §15 "Glassmorphism Specification".
 *
 * Used ONLY for genuinely floating/overlay elements: search bar, map
 * controls, layer panel, top bar, loading card, legend, tooltips.
 * Never used for drawers or stat cards (see design rationale).
 */
interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  strength?: "light" | "default" | "strong";
}

const strengthClasses = {
  light: "glass-surface-light",
  default: "glass-surface",
  strong: "glass-surface backdrop-blur-glass-strong",
};

export function GlassPanel({
  children,
  strength = "default",
  className,
  ...props
}: GlassPanelProps) {
  return (
    <div className={cn(strengthClasses[strength], "rounded-card", className)} {...props}>
      {children}
    </div>
  );
}
