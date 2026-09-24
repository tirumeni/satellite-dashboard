import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Button — implements Visual Design System §4 "Button Styles".
 *
 * Variants:
 *  - primary:   solid #2563EB, white text — reserved for the one primary
 *               action per screen (e.g. "New Search").
 *  - secondary: transparent bg, hairline border — "Adjust Filters", "Export".
 *  - ghost:     icon-only, no border/fill — map controls, drawer close.
 *
 * Sizes "pill" and "icon-lg" are Phase 2 additions for the landing page's
 * rounded nav CTA and search-bar submit button — same variant treatments,
 * just a different radius/footprint, so they compose with the variants
 * above instead of duplicating them.
 */
type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "default" | "icon" | "pill" | "icon-lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-br from-primary to-blue-700 text-white shadow-[0_4px_14px_rgba(37,99,235,.22)] hover:from-blue-500 hover:to-primary-hover active:from-primary-hover active:to-primary-hover",
  secondary:
    "border border-hairline-strong bg-white/[0.035] text-text-primary shadow-[inset_0_1px_0_rgba(255,255,255,.035)] hover:border-white/25 hover:bg-white/[0.075]",
  ghost:
    "bg-transparent text-text-primary hover:bg-white/[0.08] border border-transparent",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-9 px-std text-button-label rounded-control",
  icon: "h-9 w-9 rounded-control justify-center",
  pill: "h-9 px-std text-button-label rounded-pill",
  "icon-lg": "h-11 w-11 rounded-pill justify-center",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "default", className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "button-motion inline-flex items-center gap-tight font-medium transition-[color,background-color,transform,box-shadow] duration-instant active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-primary/70",
          "disabled:opacity-50 disabled:pointer-events-none",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
