import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  MapPinned,
  SatelliteDish,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { GlassPanel } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { ProcessingStep } from "@/types";

const STEP_DEFS: Array<{ id: string; label: string; icon: typeof Search }> = [
  { id: "understand", label: "Understanding query", icon: Search },
  { id: "extract", label: "Extracting location", icon: MapPinned },
  { id: "search", label: "Searching location", icon: Search },
  { id: "imagery", label: "Loading satellite imagery", icon: SatelliteDish },
  { id: "analysis", label: "Running AI analysis", icon: SatelliteDish },
  { id: "report", label: "Generating report", icon: MapPinned },
  { id: "complete", label: "Completed", icon: CheckCircle2 },
];

const STEP_DURATION_MS = 300;

interface ProcessingOverlayProps {
  isOpen: boolean;
  query: string;
  onComplete: () => void | Promise<void>;
}

/**
 * ProcessingOverlay — the full-screen "AI is working" experience shown
 * between search submit and dashboard navigation.
 *
 * Steps are simulated client-side since Phase 2 has no backend yet, but
 * they're modeled on the ProcessingStep contract already defined in
 * src/types (id/label/status: pending|active|done|error) — a later phase
 * can swap this timer for real progress events (e.g. over a WebSocket)
 * without changing how any consumer of this component works.
 */
export function ProcessingOverlay({
  isOpen,
  query,
  onComplete,
}: ProcessingOverlayProps) {
  const [steps, setSteps] = useState<ProcessingStep[]>(() =>
    STEP_DEFS.map((s) => ({ id: s.id, label: s.label, status: "pending" }))
  );

  useEffect(() => {
    if (!isOpen) {
      setSteps(
        STEP_DEFS.map((s) => ({ id: s.id, label: s.label, status: "pending" }))
      );
      return;
    }

    let cancelled = false;

    async function run() {
      for (let i = 0; i < STEP_DEFS.length; i++) {
        if (cancelled) return;
        setSteps((prev) =>
          prev.map((s, idx) => (idx === i ? { ...s, status: "active" } : s))
        );
        await new Promise((resolve) => setTimeout(resolve, STEP_DURATION_MS));
        if (cancelled) return;
        setSteps((prev) =>
          prev.map((s, idx) => (idx === i ? { ...s, status: "done" } : s))
        );
      }
      if (!cancelled) {
        if (!cancelled) await onComplete();
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [isOpen, onComplete]);

  const doneCount = steps.filter((s) => s.status === "done").length;
  const progress = Math.round((doneCount / steps.length) * 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/80 px-section backdrop-blur-glass-strong"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full max-w-md"
          >
            <GlassPanel className="relative overflow-hidden p-major">
              {/* radar-style scan sweep */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-24 animate-scan bg-gradient-to-b from-primary/20 to-transparent" />

              <div className="relative flex flex-col gap-section">
                <div className="flex flex-col items-center gap-tight text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 shadow-glow-primary">
                    <SatelliteDish
                      className="h-5 w-5 animate-pulse-glow text-primary"
                      strokeWidth={1.5}
                    />
                  </div>
                  <h2 className="text-h2 text-text-primary">
                    Analyzing your request
                  </h2>
                  <p className="line-clamp-2 max-w-xs text-meta text-text-muted">
                    “{query}”
                  </p>
                </div>

                <div className="flex flex-col gap-std">
                  {steps.map((step) => {
                    const def = STEP_DEFS.find((d) => d.id === step.id)!;
                    return <StepRow key={step.id} step={step} icon={def.icon} />;
                  })}
                </div>

                <div className="flex flex-col gap-tight">
                  <div className="h-1.5 w-full overflow-hidden rounded-pill bg-white/[0.06]">
                    <motion.div
                      className="h-full rounded-pill bg-gradient-to-r from-primary to-secondary"
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                  </div>
                  <p className="text-center font-mono text-meta text-text-muted">
                    {progress}%
                  </p>
                </div>
              </div>
            </GlassPanel>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StepRow({
  step,
  icon: Icon,
}: {
  step: ProcessingStep;
  icon: typeof Search;
}) {
  const isDone = step.status === "done";
  const isActive = step.status === "active";

  return (
    <div className="flex items-center gap-std">
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors duration-base",
          isDone && "border-success/40 bg-success/15",
          isActive && "border-primary/40 bg-primary/15",
          !isDone && !isActive && "border-hairline-strong bg-white/[0.02]"
        )}
      >
        {isDone ? (
          <CheckCircle2 className="h-4 w-4 text-success" strokeWidth={1.5} />
        ) : isActive ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" strokeWidth={1.5} />
        ) : (
          <Icon className="h-4 w-4 text-text-muted" strokeWidth={1.5} />
        )}
      </div>
      <span
        className={cn(
          "text-button-label transition-colors duration-base",
          isDone || isActive ? "text-text-primary" : "text-text-muted"
        )}
      >
        {step.label}
      </span>
    </div>
  );
}
