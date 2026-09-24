import { useMemo } from "react";
import { motion } from "framer-motion";
import { Satellite } from "lucide-react";

interface Star {
  id: number;
  top: string;
  left: string;
  size: number;
  delay: number;
  duration: number;
}

function generateStars(count: number): Star[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 2 + 1,
    delay: Math.random() * 4,
    duration: 2.5 + Math.random() * 2.5,
  }));
}

/**
 * SatelliteBackground — ambient, decorative backdrop for the Landing page.
 *
 * Purely presentational (pointer-events disabled) and rendered first in
 * the DOM so it paints behind the nav/hero without relying on negative
 * z-index. Built entirely from the approved dark-canvas + primary/
 * secondary palette in tailwind.config.ts so it reads as "satellite /
 * geospatial" rather than generic marketing sparkle.
 *
 * Two motion layers:
 *  - CSS keyframe animations (twinkle, float, spin-slow) for the many
 *    small/cheap elements (stars, rings).
 *  - framer-motion `animate={{ rotate }}` for the two orbiting bodies,
 *    since an accurate circular orbit needs a rotating pivot + a
 *    counter-rotated child to keep the icon upright — awkward to express
 *    as a single CSS keyframe, natural with framer-motion (already a
 *    project dependency).
 */
export function SatelliteBackground() {
  const stars = useMemo(() => generateStars(70), []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden bg-canvas"
    >
      {/* Ambient glows */}
      <div className="absolute -top-40 left-1/4 h-[560px] w-[560px] rounded-full bg-primary/20 blur-[140px]" />
      <div className="absolute top-1/3 -right-20 h-[420px] w-[420px] rounded-full bg-secondary/15 blur-[120px]" />
      <div className="absolute bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-primary/10 blur-[120px]" />

      {/* Geo grid, faded toward the edges so it reads as texture, not noise */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse at 50% 30%, black 10%, transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at 50% 30%, black 10%, transparent 70%)",
        }}
      />

      {/* Star field */}
      {stars.map((star) => (
        <span
          key={star.id}
          className="absolute animate-twinkle rounded-full bg-white"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
          }}
        />
      ))}

      {/* Orbit rings — slow independent spin for subtle parallax */}
      <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 animate-spin-slow rounded-full border border-hairline" />
      <div className="absolute left-1/2 top-1/2 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 animate-spin-slow-reverse rounded-full border border-hairline" />

      {/* Orbiting satellite */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, ease: "linear", duration: 40 }}
      >
        <motion.div
          className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2"
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, ease: "linear", duration: 40 }}
        >
          <div className="flex h-9 w-9 animate-float items-center justify-center rounded-full bg-primary/15 shadow-glow-primary">
            <Satellite className="h-4 w-4 text-primary" strokeWidth={1.5} />
          </div>
        </motion.div>
      </motion.div>

      {/* Orbiting debris point — smaller, faster, opposite direction */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2"
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, ease: "linear", duration: 65 }}
      >
        <div className="absolute left-full top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary shadow-[0_0_12px_4px_rgba(14,165,233,0.5)]" />
      </motion.div>

      {/* Vignette so foreground text always stays readable */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-canvas via-canvas/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-canvas/40 via-transparent to-canvas/80" />
    </div>
  );
}
