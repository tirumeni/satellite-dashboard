import { motion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

export type SkeletonKind = "map" | "timeline" | "summary" | "recommendations" | "metadata" | "comparison" | "charts" | "cards";

function Shimmer({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return <div className={`skeleton-shimmer rounded-control ${className}`} style={style} aria-hidden="true"/>;
}

function SkeletonSurface({ kind, children, className = "" }: { kind: SkeletonKind; children: ReactNode; className?: string }) {
  return <motion.div
    role="status"
    aria-label={`Loading ${kind}`}
    aria-busy="true"
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -6 }}
    transition={{ duration: 0.24 }}
    className={`glass-surface min-w-0 rounded-card p-section shadow-elevation-1 ${className}`}
  >{children}</motion.div>;
}

export function DashboardSkeleton({ kind, className = "" }: { kind: SkeletonKind; className?: string }) {
  if (kind === "map") return <SkeletonSurface kind={kind} className={className}>
    <div className="mb-4 flex items-center justify-between"><Shimmer className="h-3 w-36"/><Shimmer className="h-8 w-24"/></div>
    <div className="relative h-56 overflow-hidden rounded-control border border-white/[.06] bg-slate-900/50 sm:h-72">
      <Shimmer className="absolute inset-0 rounded-none"/>
      <div className="absolute left-[42%] top-[38%] h-16 w-20 rotate-12 rounded-lg border border-blue-300/40 bg-blue-400/[.06] shadow-[0_0_35px_rgba(59,130,246,.18)]"/>
      <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/60 shadow-[0_0_18px_rgba(56,189,248,.7)]"/>
      <Shimmer className="absolute bottom-3 left-3 h-7 w-32"/>
    </div>
  </SkeletonSurface>;

  if (kind === "cards") return <div className={`grid grid-cols-2 gap-3 xl:grid-cols-4 ${className}`}>
    {Array.from({ length: 4 }, (_, index) => <SkeletonSurface key={index} kind={kind} className="p-4">
      <div className="mb-5 flex items-start justify-between"><Shimmer className="h-3 w-20"/><Shimmer className="h-8 w-8 rounded-xl"/></div>
      <Shimmer className="h-7 w-28"/><Shimmer className="mt-3 h-3 w-16"/>
    </SkeletonSurface>)}
  </div>;

  if (kind === "charts") return <div className={`grid grid-cols-1 gap-std xl:grid-cols-2 ${className}`}>
    {[0, 1].map((index) => <SkeletonSurface key={index} kind={kind}>
      <Shimmer className="mb-2 h-3 w-40"/><Shimmer className="mb-5 h-2.5 w-28"/>
      <div className="relative h-48 overflow-hidden rounded-control border border-white/[.04] bg-white/[.015]">
        <div className="absolute inset-x-3 bottom-4 top-3 flex items-end gap-2 border-b border-l border-white/[.08] px-3">
          {[42, 68, 50, 84, 62, 93, 73].map((height, bar) => <Shimmer key={bar} className="flex-1 rounded-t-sm" style={{ height: `${height}%` }}/>) }
        </div>
      </div>
    </SkeletonSurface>)}
  </div>;

  if (kind === "timeline") return <SkeletonSurface kind={kind} className={className}>
    <div className="mb-4 flex items-center justify-between"><Shimmer className="h-3 w-36"/><Shimmer className="h-3 w-28"/></div>
    <div className="flex gap-2 overflow-hidden">{Array.from({ length: 5 }, (_, index) => <div key={index} className="min-w-[140px] flex-1 rounded-control border border-white/[.06] bg-white/[.02] p-3"><Shimmer className="h-4 w-12"/><Shimmer className="mt-3 h-2.5 w-20"/><Shimmer className="mt-4 h-2.5 w-full"/><Shimmer className="mt-2 h-2.5 w-4/5"/></div>)}</div>
  </SkeletonSurface>;

  if (kind === "summary") return <SkeletonSurface kind={kind} className={className}>
    <div className="mb-5 flex items-center justify-between"><Shimmer className="h-4 w-32"/><Shimmer className="h-6 w-24 rounded-pill"/></div>
    <Shimmer className="mb-2 h-3 w-full"/><Shimmer className="mb-2 h-3 w-11/12"/><Shimmer className="mb-2 h-3 w-4/5"/><Shimmer className="mt-5 h-3 w-2/3"/>
  </SkeletonSurface>;

  const rows = kind === "metadata" ? 6 : kind === "comparison" ? 4 : 3;
  return <SkeletonSurface kind={kind} className={className}>
    <Shimmer className="mb-4 h-3 w-2/5"/>
    <div className={`grid gap-3 ${kind === "metadata" ? "grid-cols-2 md:grid-cols-3" : "grid-cols-1"}`}>
      {Array.from({ length: rows }, (_, index) => <Shimmer key={index} className={kind === "comparison" ? "h-14" : "h-11"}/>) }
    </div>
  </SkeletonSurface>;
}

