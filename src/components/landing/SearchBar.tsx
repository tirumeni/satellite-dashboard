import { useState } from "react";
import type { FormEvent } from "react";
import { Search, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { getSmartQuerySuggestions } from "@/lib/aiParser";
import { getLocationSuggestions } from "@/lib/geocode";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (query?: string) => void;
  isProcessing?: boolean;
  placeholder?: string;
  recentQueries?: string[];
}

/**
 * SearchBar — the natural-language "AI Search Bar". Controlled component;
 * Landing.tsx owns the query state so PromptChips and RecentSearches can
 * both feed it. Built on the same `.glass-surface` recipe as LandingNav
 * and ProcessingOverlay for a consistent floating-glass language.
 */
export function SearchBar({
  value,
  onChange,
  onSubmit,
  isProcessing = false,
  placeholder,
  recentQueries = [],
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const suggestions = isFocused ? [...new Set([...getSmartQuerySuggestions(value, recentQueries), ...getLocationSuggestions(value)])].slice(0, 6) : [];

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isProcessing && value.trim()) onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl">
      <div
        className={cn(
          "glass-surface flex items-center gap-tight rounded-pill p-[6px] pl-std transition-shadow duration-base",
          isFocused && "shadow-glow-primary"
        )}
      >
        <Search
          className="h-[18px] w-[18px] shrink-0 text-text-muted"
          strokeWidth={1.5}
        />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={isProcessing}
          placeholder={
            placeholder ??
            "Describe the change you want to find… e.g. “deforestation near Manaus since January”"
          }
          className="h-9 w-full min-w-0 bg-transparent text-body text-text-primary placeholder:text-text-muted/70 focus:outline-none disabled:opacity-60"
        />
        <Button
          type="submit"
          variant="primary"
          size="icon-lg"
          disabled={isProcessing || !value.trim()}
          aria-label="Search"
          className="shrink-0"
        >
          {isProcessing ? (
            <Loader2 className="h-[18px] w-[18px] animate-spin" strokeWidth={1.5} />
          ) : (
            <ArrowRight className="h-[18px] w-[18px]" strokeWidth={1.5} />
          )}
        </Button>
      </div>
      {suggestions.length > 0 && !isProcessing && (
        <div className="glass-surface absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-control py-1" role="listbox" aria-label="Place suggestions">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              role="option"
              aria-selected={false}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => { onChange(suggestion); setIsFocused(false); onSubmit(suggestion); }}
              className="block w-full px-4 py-2 text-left text-body text-text-primary transition-colors hover:bg-white/[0.06]"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
