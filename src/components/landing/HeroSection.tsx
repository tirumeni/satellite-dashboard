import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const HIGHLIGHTS = [
  "Real-time satellite imagery",
  "Natural-language queries",
  "AI-generated change summaries",
];

/**
 * HeroSection — the primary above-the-fold marketing copy on Landing.
 *
 * Purely presentational; the search experience itself lives in
 * SearchBar / PromptChips / RecentSearches so each piece stays small,
 * testable, and reusable on its own (see Landing.tsx for composition).
 */
export function HeroSection() {
  return (
    <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.11 } } }} className="flex flex-col items-center gap-std text-center">
      <motion.span variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: .38, ease: "easeOut" }} className="inline-flex items-center gap-tight rounded-pill border border-hairline-strong bg-white/[0.04] px-std py-[6px] text-label-micro uppercase tracking-wide text-text-muted">
        <Sparkles className="h-3.5 w-3.5 text-secondary" strokeWidth={1.5} />
        AI-Powered Change Detection
      </motion.span>

      <motion.h1 variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: .48, ease: "easeOut" }} className="max-w-3xl text-display-sm text-text-primary md:text-display">
        See how the Earth is{" "}
        <span className="animate-gradient-x bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] bg-clip-text text-transparent">
          changing
        </span>
        , instantly.
      </motion.h1>

      <motion.p variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: .42, ease: "easeOut" }} className="max-w-xl text-body text-text-muted">
        Ask a question in plain language. PS-227 finds the satellite
        imagery, detects what changed, and explains it in seconds.
      </motion.p>

      <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} transition={{ duration: .3 }} className="flex flex-wrap items-center justify-center gap-std pt-tight">
        {HIGHLIGHTS.map((item, index) => (
          <motion.span
            key={item}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .35 + index * .07, duration: .3 }}
            className="flex items-center gap-tight text-meta text-text-muted"
          >
            <span className="h-1 w-1 rounded-full bg-secondary" />
            {item}
          </motion.span>
        ))}
      </motion.div>
    </motion.div>
  );
}
