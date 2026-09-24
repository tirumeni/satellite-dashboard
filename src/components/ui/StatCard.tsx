import type { ReactNode } from "react";
import { Activity, Cloud, ScanSearch, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

/**
 * StatCard — the "hero number" card. See Visual Design System §3.
 *
 * The 4px top accent bar ties the number back to its change-type category
 * (vegetation/water/built-up) without turning the whole card into a
 * colored block — see the design rationale in the approved spec.
 *
 * Phase 1 renders this with placeholder values only; live data wiring
 * happens in a later phase.
 */
type AccentColor = "vegetation" | "water" | "builtup" | "primary" | "muted";

const accentClasses: Record<AccentColor, string> = {
  vegetation: "bg-change-vegetation",
  water: "bg-change-water",
  builtup: "bg-change-builtup",
  primary: "bg-primary",
  muted: "bg-change-other",
};

const iconToneClasses: Record<AccentColor, string> = {
  vegetation: "text-rose-300",
  water: "text-sky-300",
  builtup: "text-amber-300",
  primary: "text-primary",
  muted: "text-text-muted",
};

interface StatCardProps {
  label: string;
  value?: ReactNode;
  accent?: AccentColor;
  placeholder?: boolean;
}

export function StatCard({
  label,
  value,
  accent = "muted",
  placeholder = false,
}: StatCardProps) {
  const normalizedLabel = label.toLowerCase();
  const Icon = normalizedLabel.includes("confidence")
    ? ShieldCheck
    : normalizedLabel.includes("cloud")
      ? Cloud
      : normalizedLabel.includes("area")
        ? ScanSearch
        : Activity;
  const entranceDelay = normalizedLabel.includes("confidence") ? 0
    : normalizedLabel.includes("detected") ? 0.07
      : normalizedLabel.includes("cloud") ? 0.14 : 0.21;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: entranceDelay }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="glass-surface overflow-hidden rounded-[20px] shadow-elevation-2 transition-shadow duration-300 hover:shadow-elevation-3"
    >
      <div className={cn("h-1", accentClasses[accent])} />
      <div className="p-section">
        <div className="flex items-start justify-between gap-3">
          <p className="text-meta font-medium uppercase tracking-wide text-text-muted">{label}</p>
          <span className={cn("rounded-control bg-white/[0.05] p-2", iconToneClasses[accent])}>
            <Icon size={17} aria-hidden="true" />
          </span>
        </div>
        {placeholder ? (
          <div className="mt-3 h-9 w-20 animate-pulse rounded-control bg-white/[0.06]" />
        ) : (
          <div className="mt-3 min-h-10 font-mono text-stat text-text-primary">{value}</div>
        )}
      </div>
    </motion.div>
  );
}
