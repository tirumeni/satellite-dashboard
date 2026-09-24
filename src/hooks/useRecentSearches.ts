import { useCallback, useEffect, useState } from "react";
import { parseSatelliteQuery, type ParsedSatelliteQuery } from "@/lib/aiParser";

const STORAGE_KEY = "ps227.recentSearches";
const MAX_ITEMS = 10;

export interface RecentSearch {
  id: string;
  query: string;
  timestamp: number;
  location: string;
  analysisType: string;
  timeRange: string;
  originalQuery: string;
}

type SearchHistoryEntry = Pick<ParsedSatelliteQuery, "location" | "analysisType" | "timeRange" | "originalQuery"> & { timestamp?: number };

function readFromStorage(): RecentSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((entry: Partial<RecentSearch>) => {
      const originalQuery = entry.originalQuery || entry.query || "";
      const parsedQuery = parseSatelliteQuery(originalQuery);
      return {
        id: entry.id || `${Date.now()}-${originalQuery}`,
        query: originalQuery,
        originalQuery,
        location: entry.location || parsedQuery.location,
        analysisType: entry.analysisType || parsedQuery.analysisType,
        timeRange: entry.timeRange || parsedQuery.timeRange,
        timestamp: entry.timestamp || Date.now(),
      };
    }).filter((entry: RecentSearch) => entry.originalQuery.length > 0);
  } catch {
    return [];
  }
}

/**
 * useRecentSearches — persists the user's last few natural-language
 * queries to localStorage so they can be re-run from the Landing page.
 *
 * Phase 1 had no search UI or client state at all. This is a Phase 2
 * addition, scoped to the landing search experience — it deliberately
 * knows nothing about routing or the dashboard.
 */
export function useRecentSearches() {
  const [items, setItems] = useState<RecentSearch[]>(() => readFromStorage());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // localStorage unavailable (private browsing, quota, etc.) — non-fatal
    }
  }, [items]);

  const addSearch = useCallback((value: string | SearchHistoryEntry) => {
    const parsed = typeof value === "string" ? parseSatelliteQuery(value) : value;
    const trimmed = parsed.originalQuery.trim();
    if (!trimmed) return;

    const previous = readFromStorage();
    const deduped = previous.filter(
        (item) => item.originalQuery.toLowerCase() !== trimmed.toLowerCase()
      );
    const next: RecentSearch[] = [
        {
          id: `${Date.now()}`,
          query: trimmed,
          originalQuery: trimmed,
          location: parsed.location,
          analysisType: parsed.analysisType,
          timeRange: parsed.timeRange,
          timestamp: Date.now(),
        },
        ...deduped,
      ];
    const limited = next.slice(0, MAX_ITEMS);
    setItems(limited);
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(limited)); } catch { /* localStorage is optional */ }
  }, []);

  const removeSearch = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearSearches = useCallback(() => setItems([]), []);

  return { items, addSearch, removeSearch, clearSearches };
}
