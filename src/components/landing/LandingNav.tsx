import { Link } from "react-router-dom";
import { Satellite, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui";

/**
 * LandingNav — glassmorphism navigation bar for the marketing/landing
 * screen. Deliberately distinct from the dashboard TopBar
 * (components/layout/TopBar): that one renders the active-query chip for
 * an in-progress analysis; this one is the pre-search, marketing header.
 *
 * `position: fixed` (not `sticky`) so it floats over the animated
 * background without reserving document-flow height — the hero section
 * below it stays perfectly centered instead of being pushed down by the
 * nav's own height.
 *
 * Reuses the same `.glass-surface` recipe (index.css) that GlassPanel is
 * built on, applied directly here since this bar needs a pill radius
 * rather than GlassPanel's default card radius.
 */
export function LandingNav() {
  return (
    <header className="glass-surface fixed left-1/2 top-6 z-40 flex w-[calc(100%-48px)] max-w-4xl -translate-x-1/2 items-center justify-between rounded-pill px-std py-tight">
      <Link to="/" className="flex items-center gap-tight">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
          <Satellite className="h-4 w-4 text-primary" strokeWidth={1.5} />
        </span>
        <span className="flex flex-col leading-none">
          <span className="text-button-label font-semibold text-text-primary">
            PS-227
          </span>
          <span className="hidden text-[10px] uppercase tracking-wide text-text-muted sm:block">
            Satellite Change Intelligence
          </span>
        </span>
      </Link>

      <span className="hidden items-center gap-tight text-meta text-text-muted md:flex">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
        System online
      </span>

      <Link to="/dashboard">
        <Button variant="secondary" size="pill">
          <LayoutDashboard className="h-4 w-4" strokeWidth={1.5} />
          <span className="hidden sm:inline">Dashboard</span>
        </Button>
      </Link>
    </header>
  );
}
