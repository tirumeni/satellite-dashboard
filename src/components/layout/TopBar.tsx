import { Satellite, Info, Menu, MapPin } from "lucide-react";
import { Button } from "@/components/ui";
import { Chip } from "@/components/ui/Chip";

interface TopBarProps {
  /**
   * The active query, if the dashboard was reached via a Landing-page
   * search (Phase 2). Falls back to Phase 1's "No active query" chip
   * text when omitted, so existing callers are unaffected.
   */
  query?: string;
}

/**
 * TopBar — persistent, sticky navigation bar.
 * See Dashboard Design Spec §5 "Sidebar / Top Bar Specifications" and
 * Visual Design System §2/§13 for the glass treatment.
 *
 * Phase 1: renders the real chrome (logo, query chip, actions) but the
 * query chip shows placeholder text — no live query state yet.
 * Phase 2: accepts an optional `query` to display instead.
 */
export function TopBar({ query }: TopBarProps) {
  return (
    <header className="glass-topbar sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b border-hairline px-3 sm:px-section">
      {/* Left: logo / product name */}
      <div className="flex shrink-0 items-center gap-tight">
        <Satellite className="h-5 w-5 text-primary" strokeWidth={1.5} />
        <span className="text-button-label font-semibold tracking-wide text-text-primary">
          PS-227
        </span>
      </div>

      {/* Center: current query chip (placeholder — no active query yet) */}
      <Chip icon={<MapPin className="h-4 w-4 shrink-0" strokeWidth={1.5} />} disabled className="mx-1 min-w-0 max-w-[42vw] flex-1 justify-center sm:mx-3 sm:flex-none sm:max-w-[min(48vw,36rem)]">
        {query || "No active query"}
      </Chip>

      {/* Right: actions */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-tight">
        <Button variant="primary" size="default" className="px-2.5 sm:px-std">
          New Search
        </Button>
        <Button variant="ghost" size="icon" aria-label="System info" className="dashboard-tooltip" data-tooltip="System information">
          <Info className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Menu" className="dashboard-tooltip md:hidden" data-tooltip="Open menu">
          <Menu className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </Button>
      </div>
    </header>
  );
}
