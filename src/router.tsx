import { AnimatePresence } from "framer-motion";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import { PageTransition } from "@/components/layout";

/**
 * AppRouter — Phase 1 routing, extended in Phase 2 with an
 * AnimatePresence-driven crossfade between routes (see PageTransition).
 *
 * Only two real destinations exist yet: Landing and the Dashboard. Per
 * the approved Information Architecture, this app is intentionally flat
 * — no nested route trees, no sidebar navigation.
 */
export function AppRouter() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageTransition>
              <Landing />
            </PageTransition>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PageTransition>
              <Dashboard />
            </PageTransition>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
