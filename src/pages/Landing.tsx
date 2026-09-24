import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  SatelliteBackground,
  LandingNav,
  HeroSection,
  SearchBar,
  PromptChips,
  RecentSearches,
  ProcessingOverlay,
} from "@/components/landing";
import { useRecentSearches } from "@/hooks/useRecentSearches";
import { geocodeLocation, getClosestLocationSuggestion, type GeocodedLocation } from "@/lib/geocode";
import { parseSatelliteQuery, type ParsedSatelliteQuery } from "@/lib/aiParser";
import { recordHistory } from "@/services/historyService";

/**
 * Landing — Phase 2 premium entry screen.
 *
 * Phase 1 shipped a bare placeholder here (logo + disabled search
 * placeholder + a link to the dashboard). Phase 2 replaces it with the
 * real natural-language search experience: an animated satellite
 * background, a glass nav, hero copy, a working search bar, example
 * prompts, persisted recent searches, and an animated "processing"
 * overlay that hands off into the (Phase 1) Dashboard.
 *
 * No backend exists yet, so submitting a query simulates the AI pipeline
 * client-side (see ProcessingOverlay) — later phases can wire real
 * progress + results without touching this composition.
 */
export default function Landing() {
  const navigate = useNavigate();
  const { items, addSearch, clearSearches } = useRecentSearches();

  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchError, setSearchError] = useState("");
  const pendingLocation = useRef<Promise<GeocodedLocation | null> | null>(null);
  const pendingIntent = useRef<ParsedSatelliteQuery | null>(null);

  const runSearch = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed || isProcessing) return;
      setQuery(trimmed);
      setActiveQuery(trimmed);
      setSearchError("");
      const intent = parseSatelliteQuery(trimmed);
      pendingIntent.current = intent;
      pendingLocation.current = intent.location ? geocodeLocation(intent.location).catch(() => null) : Promise.resolve(null);
      setIsProcessing(true);
    },
    [isProcessing]
  );

  const handleProcessingComplete = useCallback(async () => {
    const result = await pendingLocation.current;
    const intent = pendingIntent.current;
    pendingLocation.current = null;
    pendingIntent.current = null;
    if (!result) {
      const candidate = intent ? getClosestLocationSuggestion(intent.location) : undefined;
      setSearchError(candidate ? `Location not recognized. Did you mean ${candidate}?` : "Location not recognized. Please try another place.");
      setIsProcessing(false);
      return;
    }
    if (intent) {
      addSearch(intent);
      void recordHistory({ location: intent.location, analysis_type: intent.analysisType, time_range: intent.timeRange, original_query: intent.originalQuery });
    }
    setIsProcessing(false);
    navigate("/dashboard", { state: { query: activeQuery, parsedIntent: intent, locationName: result.name, lat: result.lat, lng: result.lng } });
  }, [navigate, activeQuery, addSearch]);

  return (
    <div className="relative min-h-screen">
      <SatelliteBackground />
      <LandingNav />

      <main className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-major px-section pb-section pt-32">
        <HeroSection />

        <div className="flex w-full flex-col items-center gap-section">
          <SearchBar
            value={query}
            onChange={setQuery}
            onSubmit={(submitted) => runSearch(submitted ?? query)}
            isProcessing={isProcessing}
          recentQueries={items.map((item) => item.originalQuery)}
          />
          {searchError && <p role="alert" className="text-meta text-rose-300">{searchError}</p>}
          <PromptChips onSelect={runSearch} disabled={isProcessing} />
          <RecentSearches
            items={items}
            onSelect={runSearch}
            onClear={clearSearches}
            disabled={isProcessing}
          />
        </div>
      </main>

      <ProcessingOverlay
        isOpen={isProcessing}
        query={activeQuery}
        onComplete={handleProcessingComplete}
      />
    </div>
  );
}
