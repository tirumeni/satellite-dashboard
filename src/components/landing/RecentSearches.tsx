import { Clock, X } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import type { RecentSearch } from "@/hooks/useRecentSearches";

interface RecentSearchesProps {
  items: RecentSearch[];
  onSelect: (query: string) => void;
  onClear: () => void;
  disabled?: boolean;
}

/**
 * RecentSearches — re-run a previous query with one click. Backed by
 * useRecentSearches (localStorage), so it's empty (and renders nothing)
 * until the visitor's first search. New in Phase 2 — Phase 1 had no
 * client-side state at all.
 */
export function RecentSearches({
  items,
  onSelect,
  onClear,
  disabled,
}: RecentSearchesProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex w-full max-w-2xl animate-fade-in flex-col items-center gap-tight">
      <div className="flex w-full max-w-md items-center justify-between text-label-micro uppercase tracking-wide text-text-muted">
        <span className="flex items-center gap-tight">
          <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />
          Recent searches
        </span>
        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          className="flex items-center gap-[2px] text-text-muted transition-colors duration-fast hover:text-text-primary disabled:opacity-50"
        >
          <X className="h-3 w-3" strokeWidth={1.5} />
          Clear
        </button>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-tight">
        {items.map((item) => (
          <Chip
            key={item.id}
            disabled={disabled}
            onClick={() => onSelect(item.query)}
            className="bg-transparent"
          >
            {item.query}
          </Chip>
        ))}
      </div>
    </div>
  );
}
