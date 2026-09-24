import type { ReactNode } from "react";
import { TopBar } from "./TopBar";

/**
 * DashboardLayout — shared page shell: sticky TopBar + content area.
 * See Dashboard Design Spec §2 "Layout Dimensions" (24px outer gutter,
 * 32px+ vertical rhythm between major sections).
 */
interface DashboardLayoutProps {
  children: ReactNode;
  /** Passed straight through to TopBar — see TopBar.tsx. */
  query?: string;
}

export function DashboardLayout({ children, query }: DashboardLayoutProps) {
  return (
    <div className="dashboard-shell min-h-screen">
      <TopBar query={query} />
      <main className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-5 sm:gap-major sm:px-section sm:py-section lg:px-8">
        {children}
      </main>
    </div>
  );
}
