import type { ReactNode } from "react";
import { motion } from "framer-motion";

const variants = {
  initial: { opacity: 0, y: 14, scale: 0.995, filter: "blur(3px)" },
  animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, y: -8, scale: 0.998, filter: "blur(2px)" },
};

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * PageTransition — wraps each route's element so navigation crossfades
 * smoothly instead of hard-cutting. Paired with the AnimatePresence in
 * router.tsx. New in Phase 2.
 */
export function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
