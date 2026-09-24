import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { Activity, ArrowDownRight, ArrowUpRight, Bookmark, BookmarkCheck, CalendarDays, Check, ChevronDown, CircleHelp, Clock3, Search, ShieldCheck, SlidersHorizontal, Sparkles, Satellite, Waves, Loader2, History, MapPinOff, RotateCcw, TriangleAlert } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Button, Card, CardLabel, StatCard } from "@/components/ui";
import { useRecentSearches } from "@/hooks/useRecentSearches";
import { ExportMenu, FilterDrawer, NotificationCenter } from "@/components/dashboard/DashboardControls";
import { defaultFilters, type DashboardFilters } from "@/components/dashboard/dashboardTypes";
import LeafletMapPanel from "@/components/dashboard/LeafletMapPanel";
import { geocodeLocation, getClosestLocationSuggestion, getLocationSuggestions, parseCoordinates, type GeocodedLocation } from "@/lib/geocode";
import { getSmartQuerySuggestions, parseSatelliteQuery, type ParsedSatelliteQuery } from "@/lib/aiParser";
import { downloadAnalysisExport, downloadAnalysisReport } from "@/lib/reportExporter";
import { analyze, createUnavailableAnalysis, deleteRemoteSavedAnalysis, saveRemoteAnalysis, type AnalysisInput, type MockAnalysis } from "@/services/analysisService";
import { recordHistory } from "@/services/historyService";
import { AnalysisPanel, InsightCards, MetadataPanel, RecommendationsPanel, Timeline } from "@/components/dashboard/Phase7Panels";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeletons";
import { SavedAnalysesPanel, type SavedAnalysis } from "@/components/dashboard/SavedAnalysesPanel";
import { AnalysisSummaryCard } from "@/components/dashboard/AnalysisSummaryCard";
import BeforeAfterComparison from "@/components/dashboard/BeforeAfterComparison";
import { createMockTimelineHistory } from "@/lib/mockTimelineData";
import { createMockSatelliteImage } from "@/lib/mockSatelliteImage";


const AnalyticsPanel = lazy(() => import("@/components/dashboard/AnalyticsPanel").then((module) => ({ default: module.AnalyticsPanel })));

interface DashboardLocationState { query?: string; parsedIntent?: ParsedSatelliteQuery; locationName?: string; lat?: number; lng?: number }
type Region = { name: string; detail: string; area: string; color: string };
type Analysis = {
  place: string; subtitle: string; category: string; type: string; period: string;
  radius: string; area: string; changed: string; regions: string; confidence: string;
  trend: string; summary: string; coordinates: string; coordinatesShort: string;
  dates: [string, string]; color: string; fill: string; coords: string[]; regionList: Region[];
};

const profiles: Record<string, Analysis> = {
  dubai: {
    place: "Dubai, UAE", subtitle: "Dubai metropolitan area", category: "Built-up expansion", type: "Urban growth", period: "Jan – Jun 2025", radius: "10 km", area: "18.42 km²", changed: "12.8%", regions: "24", confidence: "94.6%", trend: "+3.2%", coordinates: "25°12′ N, 55°16′ E", coordinatesShort: "25.2048° N · 55.2708° E", dates: ["Jan 14, 2025", "Jun 22, 2025"], color: "#f5a623", fill: "rgba(245,166,35,.22)",
    coords: ["18,32 30,26 39,30 47,20 59,25 64,19 77,27 87,23 94,35 87,43 75,44 70,55 58,52 51,61 42,56 33,62 27,53 17,51 21,41"],
    regionList: [{ name: "Al Maktoum corridor", detail: "South-west · construction", area: "6.8 km²", color: "#f5a623" }, { name: "Dubai Creek Harbour", detail: "North-east · mixed use", area: "4.2 km²", color: "#fb7185" }, { name: "Jebel Ali district", detail: "South · infrastructure", area: "3.1 km²", color: "#38bdf8" }],
    summary: "Satellite comparison indicates concentrated urban expansion along Dubai’s southern development corridor, with additional construction around Dubai Creek Harbour. New built-up surfaces account for 18.42 km² (12.8% of the analyzed area). The detected pattern is consistent with planned infrastructure and residential development; no major water or vegetation loss signal was detected.",
  },
  tamil: {
    place: "Tamil Nadu, India", subtitle: "Coastal Tamil Nadu · Chennai region", category: "Vegetation change", type: "Vegetation loss", period: "Jan – Jun 2025", radius: "25 km", area: "42.76 km²", changed: "8.4%", regions: "37", confidence: "91.2%", trend: "−2.1%", coordinates: "13°05′ N, 80°16′ E", coordinatesShort: "13.0827° N · 80.2707° E", dates: ["Jan 08, 2025", "Jun 18, 2025"], color: "#fb7185", fill: "rgba(251,113,133,.22)",
    coords: ["15,24 26,19 36,28 48,22 55,30 69,24 78,33 91,30 95,43 85,50 73,48 65,60 53,54 43,65 34,56 22,60 18,48 11,42"],
    regionList: [{ name: "Pallikaranai marsh edge", detail: "South Chennai · wetland pressure", area: "12.4 km²", color: "#fb7185" }, { name: "Sriperumbudur belt", detail: "West · mixed land cover", area: "10.1 km²", color: "#f5a623" }, { name: "Coastal vegetation zone", detail: "South · canopy decline", area: "8.7 km²", color: "#34d399" }],
    summary: "The comparison shows a moderate vegetation decline across the Chennai coastal belt, with the strongest signal near wetland margins and the western growth corridor. Approximately 42.76 km² changed during the period. Seasonal dryness may contribute to some observed canopy variation, so field verification is recommended around Pallikaranai marsh.",
  },
  amazon: {
    place: "Amazonas, Brazil", subtitle: "Amazon rainforest · Manaus basin", category: "Forest cover change", type: "Deforestation", period: "Jan – Jun 2025", radius: "50 km", area: "126.38 km²", changed: "4.7%", regions: "58", confidence: "96.1%", trend: "+1.4%", coordinates: "3°06′ S, 60°01′ W", coordinatesShort: "3.1190° S · 60.0217° W", dates: ["Jan 11, 2025", "Jun 25, 2025"], color: "#34d399", fill: "rgba(52,211,153,.22)",
    coords: ["16,27 26,23 34,28 43,20 52,27 61,19 70,28 81,22 91,31 86,42 78,46 71,58 61,53 53,64 43,57 35,63 29,53 19,51 22,40 13,36"],
    regionList: [{ name: "Southern frontier", detail: "South basin · forest clearing", area: "48.6 km²", color: "#34d399" }, { name: "BR-319 corridor", detail: "East · linear disturbance", area: "31.2 km²", color: "#f5a623" }, { name: "Rio Madeira basin", detail: "South-west · canopy loss", area: "22.8 km²", color: "#fb7185" }],
    summary: "A high-confidence forest disturbance signal spans 126.38 km² across the southern Manaus basin. Change clusters follow established road corridors and include several newly exposed clearings. This is a mock screening result; cloud cover, seasonal flooding and natural canopy cycles can affect optical classification and should be checked before operational use.",
  },
  california: {
    place: "California, USA", subtitle: "Central Valley · Sacramento region", category: "Water change", type: "Surface water change", period: "Jan – Jun 2025", radius: "30 km", area: "31.09 km²", changed: "6.3%", regions: "19", confidence: "89.8%", trend: "−4.6%", coordinates: "38°35′ N, 121°30′ W", coordinatesShort: "38.5816° N · 121.4944° W", dates: ["Jan 06, 2025", "Jun 20, 2025"], color: "#38bdf8", fill: "rgba(56,189,248,.22)",
    coords: ["18,29 27,22 38,26 46,18 56,26 68,22 78,31 90,27 94,40 85,49 75,47 68,60 57,54 49,63 39,57 31,64 23,54 14,49 19,40"],
    regionList: [{ name: "Folsom Reservoir", detail: "East · surface water decline", area: "14.2 km²", color: "#38bdf8" }, { name: "Delta wetlands", detail: "South-west · water extent", area: "8.6 km²", color: "#34d399" }, { name: "Agricultural fringe", detail: "South · irrigation ponds", area: "4.9 km²", color: "#f5a623" }],
    summary: "Surface water extent has declined across several monitored areas in the Sacramento basin, with the clearest difference around Folsom Reservoir. The total mapped change is 31.09 km² (6.3% of the area of interest). The signal is consistent with seasonal drawdown, though local wetland edges show smaller shifts that merit continued monitoring.",
  },
};

function getAnalysis(query: string): Analysis | null {
  const normalized = query.toLowerCase();
  const directCoordinates = parseCoordinates(query);
  if (directCoordinates) return {
    ...profiles.amazon,
    place: "Selected coordinates",
    subtitle: `${directCoordinates.lat.toFixed(5)}, ${directCoordinates.lng.toFixed(5)}`,
    coordinates: `${directCoordinates.lat.toFixed(5)}, ${directCoordinates.lng.toFixed(5)}`,
    coordinatesShort: `${directCoordinates.lat.toFixed(5)} · ${directCoordinates.lng.toFixed(5)}`,
    summary: "Coordinate search centered the map on the selected point. Sample change analysis is shown for demonstration only.",
  };
  const supported = /dubai|uae|tamil|chennai|india|amazon|manaus|brazil|california|sacramento|urban expansion|flood|deforestation|wildfire|mining|road construction|construction|agricultur|\broads?\b|forest|vegetation|water change/i.test(normalized);
  if (!supported) return null;
  const key = normalized.includes("dubai") || normalized.includes("uae") || normalized.includes("urban expansion") ? "dubai"
    : normalized.includes("tamil") || normalized.includes("chennai") || normalized.includes("india") ? "tamil"
    : normalized.includes("california") || normalized.includes("sacramento") || normalized.includes("flood") || normalized.includes("water change") ? "california"
    : normalized.includes("chennai") || normalized.includes("tamil") || normalized.includes("agricultur") || normalized.includes("vegetation") ? "tamil" : "amazon";
  const profile = profiles[key];
  if (key !== "amazon" || /amazon|manaus|brazil|deforestation|forest|vegetation/i.test(query)) {
    if (/wildfire/i.test(normalized)) return { ...profiles.amazon, category: "Wildfire impact", type: "Burn scar detection", area: "63.24 km²", changed: "5.9%", regions: "16", confidence: "92.7%", summary: "Mock burn-scar screening identifies several clusters of changed vegetation consistent with recent fire impact. The mapped footprint covers 63.24 km². Burn severity is illustrative and should be verified against incident records and field observations." };
    if (/mining/i.test(normalized)) return { ...profiles.amazon, category: "Mining activity", type: "Land disturbance", area: "9.82 km²", changed: "3.6%", regions: "12", confidence: "90.4%", summary: "Mock screening flags new surface disturbance patterns that may be associated with mining activity. Detected clusters follow several access corridors and total 9.82 km². This sample classification requires independent review before interpretation." };
    if (/road construction/i.test(normalized)) return { ...profiles.dubai, category: "Infrastructure change", type: "Road construction", area: "7.46 km²", changed: "4.1%", regions: "11", confidence: "93.1%", summary: "Mock change detection highlights linear land disturbance consistent with road construction. The largest segments appear near connecting infrastructure and developing areas, covering 7.46 km² in total." };
    return profile;
  }
  const named = query.replace(/^(show|analyze|monitor|detect|find|track)\s+(changes?\s+in|around|near|for)?\s*/i, "").trim();
  return { ...profile, place: named ? named.replace(/\b\w/g, (s) => s.toUpperCase()) : profile.place, subtitle: named ? `Area of interest · ${named}` : profile.subtitle,
    summary: `Mock satellite screening for ${named || profile.place} shows a forest cover change signal across 126.38 km². The largest detected clusters follow the southern frontier and nearby transport corridors. This illustrative result is generated locally from sample data and should be validated with current imagery and field observations.` };
}

function mapCenterForQuery(query: string): { lat: number; lng: number } {
  const value = query.toLowerCase();
  if (/dubai|uae|urban expansion/i.test(value)) return { lat: 25.2048, lng: 55.2708 };
  if (/tamil|chennai|india/i.test(value)) return { lat: 13.0827, lng: 80.2707 };
  if (/california|sacramento|flood|water change/i.test(value)) return { lat: 38.5816, lng: -121.4944 };
  return { lat: -3.119, lng: -60.0217 };
}

function CountUp({ value }: { value: string }) {
  const number = Number(value.match(/[\d.]+/)?.[0] ?? 0);
  const decimals = value.match(/\.(\d+)/)?.[1].length ?? 0;
  const suffix = value.replace(/[\d.]/g, "");
  const [count, setCount] = useState(0);
  useEffect(() => {
    let frame = 0;
    const timer = window.setInterval(() => { frame += 1; setCount(number * Math.min(frame / 30, 1)); if (frame >= 30) window.clearInterval(timer); }, 22);
    return () => window.clearInterval(timer);
  }, [number]);
  return <motion.span initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} key={value}>{count.toFixed(decimals)}{suffix}</motion.span>;
}

export default function Dashboard() {
  const location = useLocation(); const navigate = useNavigate();
  const routeState = (location.state as DashboardLocationState | null) ?? {};
  const initialQuery = routeState.query ?? "Analyze recent land cover change in the Amazon rainforest";
  const [query, setQuery] = useState(initialQuery);
  const [parsedIntent, setParsedIntent] = useState<ParsedSatelliteQuery>(() => routeState.parsedIntent ?? parseSatelliteQuery(initialQuery));
  const [selectedLocation, setSelectedLocation] = useState<GeocodedLocation>(() => {
    const fallback = mapCenterForQuery(initialQuery);
    return { lat: routeState.lat ?? fallback.lat, lng: routeState.lng ?? fallback.lng, name: routeState.locationName ?? initialQuery };
  });
  const [input, setInput] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);
  const [analysisRetry, setAnalysisRetry] = useState(0);
  const [analysisRequest, setAnalysisRequest] = useState<{ key: string; analysis: MockAnalysis; source: "backend" | "error"; warning?: string } | null>(null);
  const [isAnalysisPending, setIsAnalysisPending] = useState(false);
  const [saved, setSaved] = useState<SavedAnalysis[]>(() => { try { const raw = JSON.parse(localStorage.getItem("ps227.savedAnalyses") || "[]") as unknown[]; return raw.map((entry,index) => typeof entry === "string" ? {id:`legacy-${index}`,title:entry,query:entry,year:2025} : entry as SavedAnalysis); } catch { return []; } });
  const [selectedYear, setSelectedYear] = useState(2025);
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [typedSummary, setTypedSummary] = useState("");
  const { items: recentSearches, addSearch } = useRecentSearches();
  const baseData = useMemo(() => getAnalysis(query), [query]);
  const data = useMemo(() => {
    if (!baseData) return null;
    const baselineArea = Number(baseData.area.match(/[\d.]+/)?.[0] ?? 0);
    const yearFactor = 0.72 + (selectedYear - 2021) * 0.105;
    const visibleArea = Math.max(0, baselineArea * yearFactor - filters.area);
    const confidence = filters.confidence === "Low" ? "52.4%" : filters.confidence === "Medium" ? "76.8%" : filters.confidence === "High" ? "96.1%" : baseData.confidence;
    const cloudFactor = filters.cloud < 20 ? 1.04 : filters.cloud > 70 ? .91 : 1;
    const area = (visibleArea * cloudFactor).toFixed(2);
    const period = filters.dateRange.replace(" – ", "–");
    const category = filters.changeTypes.length ? `${filters.changeTypes.join(" / ")} change` : baseData.category;
    const sensorFactor = filters.satellite === "Sentinel-1" ? .92 : filters.satellite === "Landsat" ? .84 : 1;
    return { ...baseData, dates: baseData.dates.map((date) => date.replace(/20\d{2}/, String(selectedYear))) as [string, string], area: `${area} km²`, changed: `${(Number(baseData.changed.replace("%", "")) * sensorFactor * cloudFactor).toFixed(1)}%`, regions: String(Math.max(0, Math.round(Number(baseData.regions) * sensorFactor * cloudFactor))), confidence, period, category, summary: `${baseData.summary} Active filters: ${filters.satellite}, ${filters.resolution}, cloud ≤${filters.cloud}%, ${period}.` };
  }, [baseData, filters, selectedYear]);
  const analysisInput = useMemo<AnalysisInput>(() => ({
    query, location: parsedIntent.location || selectedLocation.name, analysisType: parsedIntent.analysisType, timeRange: parsedIntent.timeRange, year: selectedYear, beforeYear: selectedYear - 1,
    coordinates: `${selectedLocation.lat.toFixed(5)}, ${selectedLocation.lng.toFixed(5)}`,
    satellite: filters.satellite, resolution: filters.resolution, cloudCoverage: filters.cloud,
    filters: { dateRange: filters.dateRange, confidence: filters.confidence, areaThreshold: filters.area, changeTypes: filters.changeTypes },
    changedAreaKm2: data ? Number(data.area.match(/[\d.]+/)?.[0] ?? 0) : undefined,
    confidence: data ? Number(data.confidence.match(/[\d.]+/)?.[0] ?? 0) : undefined,
  }), [query, parsedIntent, selectedYear, selectedLocation, filters.satellite, filters.resolution, filters.cloud, filters.dateRange, filters.confidence, filters.area, filters.changeTypes, data]);
  // Timeline year selection is local history navigation. It must not create a new
  // Gemini request; only changes to the search context or filters do that.
  const analysisKey = JSON.stringify({
    query: analysisInput.query, location: analysisInput.location, analysisType: analysisInput.analysisType,
    timeRange: analysisInput.timeRange, coordinates: analysisInput.coordinates, satellite: analysisInput.satellite,
    resolution: analysisInput.resolution, cloudCoverage: analysisInput.cloudCoverage, filters: analysisInput.filters,
  });
  const analysisInputRef = useRef(analysisInput);
  analysisInputRef.current = analysisInput;
  const unavailableAnalysis = useMemo(() => createUnavailableAnalysis(analysisInput), [analysisInput]);
  const generated = analysisRequest?.key === analysisKey ? analysisRequest.analysis : unavailableAnalysis;
  useEffect(() => {
    const controller = new AbortController(); let active = true;
    const requestInput = analysisInputRef.current;
    const requestKey = analysisKey;
    setAnalysisRequest(null); setIsAnalysisPending(true);
    void analyze(requestInput, { signal: controller.signal }).then((result) => {
      if (active) setAnalysisRequest({ key: requestKey, analysis: result.analysis, source: result.source, warning: result.warning });
    }).finally(() => { if (active) setIsAnalysisPending(false); });
    return () => { active = false; controller.abort(); };
  }, [analysisKey, analysisRetry]);
  const historyArea = generated.areaKm2 || Number(baseData?.area.match(/[\d.]+/)?.[0] ?? 24);
  const timelineHistory = useMemo(
    () => createMockTimelineHistory(parsedIntent.location || selectedLocation.name, parsedIntent.analysisType, historyArea),
    [parsedIntent.location, parsedIntent.analysisType, selectedLocation.name, historyArea],
  );
  const selectedHistory = timelineHistory.find((item) => item.year === selectedYear) ?? timelineHistory[timelineHistory.length - 1];
  const displayAnalysis = useMemo<MockAnalysis>(() => ({
    ...generated,
    confidence: selectedHistory.confidence,
    severity: selectedHistory.severity,
    areaKm2: selectedHistory.affectedAreaKm2,
    dateRange: selectedHistory.acquisitionDate,
    summary: `${generated.summary} Selected ${selectedHistory.year} local history records ${selectedHistory.affectedAreaKm2} km² of estimated change at ${selectedHistory.confidence}% confidence.`,
    metadata: {
      ...generated.metadata,
      analysisDate: selectedHistory.acquisitionDate,
      satelliteSource: selectedHistory.satelliteSource,
      cloudCoverage: selectedHistory.cloudCover,
      aiConfidence: `${selectedHistory.confidence}%`,
      selectedTimeRange: `${selectedHistory.year} imagery`,
    },
    beforeImage: createMockSatelliteImage(generated.seed, selectedYear - 1),
    afterImage: createMockSatelliteImage(generated.seed + 53, selectedYear),
    beforeYear: selectedYear - 1,
    afterYear: selectedYear,
    timelineData: timelineHistory.map((item) => ({
      year: item.year, changeType: generated.changeType, confidence: item.confidence,
      affectedAreaKm2: item.affectedAreaKm2, severity: item.severity,
    })),
    seed: generated.seed ^ selectedYear,
  }), [generated, selectedHistory, selectedYear, timelineHistory]);
  const [activeRegion, setActiveRegion] = useState(0);
  const [toast, setToast] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestions = ["Dubai urban expansion", "Tamil Nadu vegetation change", "Amazon deforestation", "California flood detection"];
  const chips = ["Urban Expansion", "Flood Detection", "Deforestation", "Wildfire", "Mining", "Road Construction"];
  const stages = ["Understanding query", "Extracting location", "Searching location", "Preparing analysis context", "Running AI analysis", "Generating report", "Completed"];
  const filteredSuggestions = Array.from(new Set([...getSmartQuerySuggestions(input, recentSearches.map((item) => item.originalQuery)), ...getLocationSuggestions(input), ...suggestions.filter((value) => value.toLowerCase().includes(input.toLowerCase()))])).slice(0, 6);

  function showToast(message: string) { setToast(message); window.setTimeout(() => setToast(""), 2800); }
  function exportMock(format: string) {
    try {
      if (format === "PDF") downloadAnalysisReport(query, selectedLocation.name, selectedYear, displayAnalysis);
      else downloadAnalysisExport(format, displayAnalysis);
      showToast(`${format} export downloaded successfully.`);
    } catch { showToast(`${format} export could not be created in this browser.`); }
  }

  useEffect(() => { setInput(query); }, [query]);
  useEffect(() => {
    if (!displayAnalysis.summary) { setTypedSummary(""); return; }
    setTypedSummary("");
    let cursor = 0;
    const timer = window.setInterval(() => { cursor += 5; setTypedSummary(displayAnalysis.summary.slice(0, cursor)); if (cursor >= displayAnalysis.summary.length) window.clearInterval(timer); }, 12);
    return () => window.clearInterval(timer);
  }, [displayAnalysis.summary]);
  useEffect(() => { try { localStorage.setItem("ps227.savedAnalyses", JSON.stringify(saved)); } catch { /* storage is optional */ } }, [saved]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "/" && !["INPUT", "TEXTAREA"].includes((event.target as HTMLElement).tagName)) { event.preventDefault(); inputRef.current?.focus(); }
      if (event.key === "Escape") setSuggestionsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function runSearch(raw: string) {
    const next = raw.trim(); if (!next || isLoading) return;
    let intent = parseSatelliteQuery(next);
    // Category chips can be applied to the currently selected area of interest.
    if (!intent.location && intent.analysisType !== "change detection") intent = { ...intent, location: selectedLocation.name };
    setInput(next); setSuggestionsOpen(false); setIsLoading(true); setLoadingStep(0); setSearchError("");
    const locationPromise = intent.location ? geocodeLocation(intent.location).catch(() => null) : Promise.resolve(null);
    for (let i = 0; i < stages.length; i++) { setLoadingStep(i); await new Promise((resolve) => window.setTimeout(resolve, 420)); }
    const result = await locationPromise;
    if (!result) {
      setIsLoading(false);
      const suggestion = getClosestLocationSuggestion(intent.location);
      setSearchError(suggestion ? `Location not recognized. Closest suggestion: ${suggestion}` : "Location not recognized. Please try another place.");
      return;
    }
    setSelectedLocation(result);
    setQuery(next); setParsedIntent(intent); addSearch(intent); setActiveRegion(0); setIsLoading(false);
    void recordHistory({ location: intent.location, analysis_type: intent.analysisType, time_range: intent.timeRange, original_query: intent.originalQuery });
  }
  function saveCurrent() {
    if (saved.some((item) => item.query.toLowerCase() === query.toLowerCase() && item.year === selectedYear)) { showToast("Analysis is already saved."); return; }
    const localId = `${Date.now()}`; const title = `${data?.place ?? query} - ${selectedYear}`;
    setSaved((items) => [{ id: localId, title, query, year: selectedYear }, ...items]); showToast("Analysis saved locally.");
    if (analysisRequest?.key === analysisKey && analysisRequest.source === "backend") {
      void saveRemoteAnalysis(analysisRequest.analysis.metadata.analysisId, title).then((remote) => {
        setSaved((items) => items.map((item) => item.id === localId ? { ...item, backendId: remote.id } : item));
        showToast("Analysis synced to backend.");
      }).catch(() => showToast("Saved locally; backend save will need a retry."));
    }
  }
  function openSaved(item: SavedAnalysis) { setSelectedYear(item.year); void runSearch(item.query); }
  const isSaved = saved.some((item) => item.query.toLowerCase() === query.toLowerCase() && item.year === selectedYear);
  const previousHistory = timelineHistory.find((item) => item.year === selectedYear - 1);
  const confidenceDelta = previousHistory ? selectedHistory.confidence - previousHistory.confidence : null;
  const cloudDelta = previousHistory ? Number(selectedHistory.cloudCover.replace("%", "")) - Number(previousHistory.cloudCover.replace("%", "")) : null;
  const areaDelta = previousHistory ? selectedHistory.affectedAreaKm2 - previousHistory.affectedAreaKm2 : null;
  const trendBadge = (label: string, tone = "text-emerald-300 bg-emerald-400/10") => <span className={`inline-flex shrink-0 items-center rounded-pill px-2 py-1 font-sans text-[10px] font-semibold ${tone}`}>{label}</span>;
  return <DashboardLayout query={query}>
    <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:.3,ease:"easeOut"}} className="flex flex-col gap-std">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><div className="mb-2 flex items-center gap-2 text-meta text-text-muted"><span>Analysis workspace</span><span>/</span><span className="text-text-primary">{data?.place ?? "New search"}</span></div><h1 className="text-h1 text-text-primary">Satellite change analysis</h1><p className="mt-1 text-meta text-text-muted">A location-based overview of observed surface change.</p></div><div className="flex flex-wrap items-center gap-2"><NotificationCenter/><ExportMenu onExport={exportMock}/><Button variant="secondary" onClick={() => navigate("/")}><Search size={15}/> Edit query</Button><Button variant="primary" onClick={() => navigate("/")}><Sparkles size={15}/> New analysis</Button></div></div>
      <section className="relative"><form className="glass-surface mx-auto flex w-full max-w-3xl items-center gap-2 rounded-pill p-1.5 pl-4" onSubmit={(event) => { event.preventDefault(); void runSearch(input); }}><Search size={17} className="shrink-0 text-text-muted"/><input ref={inputRef} value={input} onChange={(event) => { setInput(event.target.value); setSuggestionsOpen(true); }} onFocus={() => setSuggestionsOpen(true)} onBlur={() => window.setTimeout(() => setSuggestionsOpen(false), 150)} placeholder="Search a location or change type..." aria-label="Search location or change type" className="h-10 min-w-0 flex-1 bg-transparent text-body text-text-primary outline-none placeholder:text-text-muted/70"/><Button type="submit" disabled={isLoading || !input.trim()}><Search size={15}/> Analyze</Button></form>{suggestionsOpen && input && <div className="absolute left-1/2 top-full z-20 mt-2 w-[min(92%,48rem)] -translate-x-1/2 overflow-hidden rounded-card border border-hairline bg-surface shadow-elevation-3">{filteredSuggestions.length ? filteredSuggestions.map((suggestion) => <button key={suggestion} onMouseDown={() => void runSearch(suggestion)} className="flex w-full items-center gap-3 px-4 py-3 text-left text-button-label text-text-primary hover:bg-white/[0.06]"><Search size={14} className="text-text-muted"/>{suggestion}</button>) : <p className="px-4 py-3 text-meta text-text-muted">No matching suggestions. Press Analyze to check this query.</p>}</div>}<div className="mx-auto mt-3 flex max-w-3xl flex-wrap justify-center gap-2">{chips.map((chip) => <button key={chip} onClick={() => void runSearch(chip)} className="rounded-pill border border-hairline bg-white/[0.025] px-3 py-1.5 text-meta text-text-muted transition-colors hover:border-primary/50 hover:text-text-primary">{chip}</button>)}</div></section>
      <FilterDrawer onApply={(next) => { setFilters(next); showToast("Filters applied to AI analysis."); }}/>
      <div className="grid grid-cols-1 gap-std lg:grid-cols-2"><Card><div className="mb-3 flex items-center gap-2"><History size={15} className="text-text-muted"/><CardLabel>Recent Searches</CardLabel><span className="ml-auto text-meta text-text-muted">Last 10</span></div>{recentSearches.length ? <div className="flex flex-wrap gap-2">{recentSearches.map((item) => <button key={item.id} onClick={() => void runSearch(item.query)} className="max-w-full truncate rounded-control border border-hairline px-3 py-2 text-meta text-text-primary hover:border-primary/50">{item.query}</button>)}</div> : <div className="flex items-center gap-3 rounded-control border border-dashed border-hairline bg-white/[.015] px-3 py-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/[.08] text-primary"><History size={16}/></span><div><p className="text-meta font-medium text-text-primary">Your search history is ready</p><p className="mt-0.5 text-meta text-text-muted">Recent locations will appear here for quick access.</p></div></div>}</Card><SavedAnalysesPanel items={saved} currentQuery={query} year={selectedYear} onSave={saveCurrent} onOpen={openSaved} onRename={(id,title)=>setSaved(items=>items.map(item=>item.id===id?{...item,title}:item))} onDelete={(id)=>{const item=saved.find(value=>value.id===id);if(item?.backendId)void deleteRemoteSavedAnalysis(item.backendId).catch(()=>showToast("Removed locally; backend delete did not complete."));setSaved(items=>items.filter(value=>value.id!==id));}}/></div>
      {data && <div className="flex justify-end"><Button variant="secondary" onClick={saveCurrent}>{isSaved ? <BookmarkCheck size={15}/> : <Bookmark size={15}/>} {isSaved ? "Saved analysis" : "Save analysis"}</Button></div>}
      <div className="relative h-[500px] overflow-hidden rounded-card">
        <LeafletMapPanel lat={selectedLocation.lat + (selectedYear-2025)*0.0015} lng={selectedLocation.lng + (selectedYear-2025)*0.0015} locationName={`${selectedLocation.name} · ${selectedYear}`} onLocationChange={(place) => { setSelectedLocation(place); setParsedIntent((current) => ({ ...current, location: place.name })); }} onLocationError={showToast}/>
        <AnimatePresence initial={false}>{isAnalysisPending && <motion.div key="map-loading" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.25}} className="pointer-events-none absolute inset-0 z-[600]"><DashboardSkeleton kind="map" className="h-full"/></motion.div>}</AnimatePresence>
      </div>
      <AnimatePresence initial={false}>
        {!isAnalysisPending && analysisRequest?.source === "error" && <motion.div key="analysis-error" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-5}} transition={{duration:.22}}>
          <Card role="alert" className="flex flex-wrap items-center justify-between gap-4 border-amber-400/20 bg-amber-400/[.035]">
            <div className="flex min-w-0 items-start gap-3"><span className="rounded-control bg-amber-300/10 p-2.5 text-amber-200"><TriangleAlert size={18}/></span><div><p className="text-button-label font-semibold text-amber-100">Analysis couldn’t be completed</p><p className="mt-1 text-meta leading-5 text-text-muted">{analysisRequest.warning}</p></div></div>
            <Button variant="secondary" onClick={() => setAnalysisRetry((attempt) => attempt + 1)}><RotateCcw size={14}/> Retry analysis</Button>
          </Card>
        </motion.div>}
      </AnimatePresence>
      <AnimatePresence initial={false}>{searchError && <motion.div key="search-error" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-5}} transition={{duration:.22}}>
        <Card role="alert" className="flex items-start gap-3 border-rose-400/25 bg-rose-400/[.035]"><span className="rounded-control bg-rose-300/10 p-2.5 text-rose-200"><MapPinOff size={18}/></span><div><p className="text-button-label font-semibold text-rose-100">Location not recognized</p><p className="mt-1 text-meta leading-5 text-text-muted">{searchError}</p><p className="mt-2 text-meta text-text-muted">Try a city, region, landmark, or coordinates.</p></div></Card>
      </motion.div>}</AnimatePresence>
      <AnimatePresence mode="wait" initial={false}>{isAnalysisPending
        ? <DashboardSkeleton key="summary-loading" kind="summary"/>
        : <motion.div key="summary-ready" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.24}}><AnalysisSummaryCard
          location={data?.place ?? parsedIntent.location ?? selectedLocation.name}
          analysisType={data?.type ?? parsedIntent.analysisType}
          confidence={displayAnalysis.confidence || Number(data?.confidence.match(/[\d.]+/)?.[0] ?? 0)}
          severity={displayAnalysis.severity}
          satelliteSource={displayAnalysis.metadata.satelliteSource}
          acquisitionDate={selectedHistory.acquisitionDate}
          cloudCover={displayAnalysis.metadata.cloudCoverage}
          aoiSize={data?.radius ? `${data.radius} radius` : undefined}
        /></motion.div>}
      </AnimatePresence>
      {!data ? <motion.section initial={{opacity:0,y:12,scale:.985}} animate={{opacity:1,y:0,scale:1}} transition={{duration:.3}} className="glass-surface relative mx-auto w-full max-w-3xl overflow-hidden rounded-card px-6 py-10 text-center sm:px-10">
        <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl"/>
        <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/[.08] text-primary shadow-[0_0_34px_rgba(56,189,248,.12)]"><Satellite size={27}/><span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-canvas bg-amber-300"/></div>
        <p className="relative mb-2 text-label-micro font-semibold uppercase tracking-[.18em] text-primary">Analysis workspace</p><h2 className="relative text-h2 text-text-primary">No results found</h2>
        <p className="relative mx-auto mt-2 max-w-lg text-meta leading-6 text-text-muted">We couldn’t match “{query}” to an available mock satellite dataset. Try one of these supported analysis queries.</p>
        <p className="relative mt-6 text-label-micro uppercase tracking-wide text-text-muted">Suggested queries</p>
        <div className="relative mt-3 flex flex-wrap justify-center gap-2">{suggestions.map((suggestion) => <button key={suggestion} onClick={() => void runSearch(suggestion)} className="rounded-pill border border-hairline bg-white/[.025] px-3 py-2 text-meta text-text-primary transition hover:border-primary/50 hover:bg-primary/[.06]">{suggestion}</button>)}</div>
      </motion.section> : <>
      <div className="space-y-std">
        <BeforeAfterComparison seed={generated.seed} location={data.place}/>
        <AnimatePresence mode="wait" initial={false}>{isAnalysisPending ? <DashboardSkeleton key="timeline-loading" kind="timeline"/> : <motion.div key="timeline-ready" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.24}}><Timeline year={selectedYear} data={timelineHistory} onChange={setSelectedYear}/></motion.div>}</AnimatePresence>
        <InsightCards seed={displayAnalysis.seed}/><AnalysisPanel result={displayAnalysis} location={data.place} year={selectedYear}/><RecommendationsPanel recommendations={displayAnalysis.recommendations}/><MetadataPanel metadata={displayAnalysis.metadata}/>
      </div>
      <div className="grid grid-cols-1 gap-std lg:grid-cols-[1.1fr_2fr]">
        <Card className="flex flex-col gap-4"><div className="flex items-center gap-2"><Search className="h-4 w-4 text-text-muted"/><CardLabel>Query Interpretation</CardLabel></div><div className="rounded-control border border-hairline bg-white/[0.025] p-3.5"><p className="text-body text-text-primary">“{query}”</p></div><div className="grid grid-cols-2 gap-x-3 gap-y-4"><div><CardLabel>LOCATION</CardLabel><p className="mt-1 text-button-label font-medium text-text-primary">{data.place}</p></div><div><CardLabel>CHANGE TYPE</CardLabel><p className="mt-1 text-button-label font-medium text-text-primary">{data.type}</p></div><div><CardLabel>TIME RANGE</CardLabel><p className="mt-1 flex items-center gap-1.5 text-button-label text-text-primary"><CalendarDays size={14} className="text-text-muted"/>{data.period}</p></div><div><CardLabel>SEARCH RADIUS</CardLabel><p className="mt-1 text-button-label text-text-primary">{data.radius}</p></div></div><div className="flex items-center gap-1.5 border-t border-hairline pt-3 text-meta text-text-muted"><Check size={14} className="text-emerald-400"/> Query parsed · location and dates resolved</div></Card>
        <AnimatePresence mode="wait" initial={false}>{isAnalysisPending
          ? <DashboardSkeleton key="kpi-loading" kind="cards" className="lg:col-span-1"/>
          : <motion.div key={query} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.24}} className="grid grid-cols-2 gap-std xl:grid-cols-4">
          <StatCard label="Confidence" accent="primary" value={<div className="flex flex-wrap items-center justify-between gap-2"><span><CountUp value={`${displayAnalysis.confidence}%`}/></span>{trendBadge(confidenceDelta === null ? "Baseline" : `${confidenceDelta >= 0 ? "↑" : "↓"} ${Math.abs(confidenceDelta).toFixed(1)}%`)}</div>}/>
          <StatCard label="Detected Change" accent="builtup" value={<div className="space-y-2"><p className="truncate font-sans text-base font-semibold" title={displayAnalysis.changeType}>{displayAnalysis.changeType}</p>{trendBadge(`${displayAnalysis.severity} Severity`, displayAnalysis.severity === "High" ? "text-rose-300 bg-rose-400/10" : displayAnalysis.severity === "Moderate" ? "text-amber-200 bg-amber-400/10" : "text-emerald-300 bg-emerald-400/10")}</div>}/>
          <StatCard label="Cloud Cover" accent="water" value={<div className="flex flex-wrap items-center justify-between gap-2"><span><CountUp value={selectedHistory.cloudCover}/></span><span className="inline-flex shrink-0 items-center rounded-pill bg-sky-400/10 px-2 py-1 font-sans text-[10px] font-semibold text-sky-200">{Number(selectedHistory.cloudCover.replace("%", "")) <= 15 ? "Low" : Number(selectedHistory.cloudCover.replace("%", "")) <= 25 ? "Moderate" : "High"}{cloudDelta === null ? "" : ` · ${cloudDelta >= 0 ? "↑" : "↓"} ${Math.abs(cloudDelta)}%`}</span></div>}/>
          <StatCard label="Affected Area" accent="vegetation" value={<div className="flex flex-wrap items-center justify-between gap-2"><span><CountUp value={`${displayAnalysis.areaKm2} km²`}/></span>{trendBadge(areaDelta === null ? "Baseline" : `${areaDelta >= 0 ? "+" : "−"}${Math.abs(areaDelta).toFixed(1)} km²`, "text-violet-200 bg-violet-400/10")}</div>}/>
        </motion.div>}
        </AnimatePresence>
      </div>
      <div className="grid grid-cols-1 gap-std xl:grid-cols-[1.55fr_1fr]">
        <AnimatePresence mode="wait" initial={false}>{isAnalysisPending
          ? <DashboardSkeleton key="ai-summary-loading" kind="summary"/>
          : <motion.div key="ai-summary-ready" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.24}}><Card><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary"/><CardLabel>AI Summary</CardLabel></div><span className="inline-flex items-center gap-1.5 rounded-pill bg-emerald-400/10 px-2.5 py-1 text-meta text-emerald-300"><ShieldCheck size={13}/> {displayAnalysis.confidence}% Gemini confidence</span></div><p className="text-body leading-7 text-text-primary">{typedSummary}<span className="ml-0.5 inline-block h-4 w-px animate-pulse bg-primary align-middle"/></p><div className="mt-4 flex flex-wrap gap-2"><span className="rounded-pill border border-hairline px-2.5 py-1 text-meta text-text-muted">{displayAnalysis.changeType}</span><span className="rounded-pill border border-hairline px-2.5 py-1 text-meta text-text-muted">{displayAnalysis.dateRange}</span><span className="rounded-pill border border-hairline px-2.5 py-1 text-meta text-text-muted">{analysisRequest?.source === "backend" ? "Gemini generated" : "Awaiting Gemini analysis"}</span></div></Card></motion.div>}
        </AnimatePresence>
        <Card><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2"><Activity className="h-4 w-4 text-text-muted"/><CardLabel>Observation Timeline</CardLabel></div><span className="text-meta text-text-muted">{selectedYear}</span></div><div className="relative ml-1 border-l border-hairline pl-5"><div className="relative pb-6"><span className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full border-2 border-primary bg-surface"/><p className="text-meta font-medium text-text-primary">{data.dates[0]} <span className="ml-1 font-normal text-text-muted">· Baseline capture</span></p><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full w-full rounded-full bg-sky-400/60"/></div></div><div className="relative"><span className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-primary/15"/><p className="text-meta font-medium text-text-primary">{data.dates[1]} <span className="ml-1 font-normal text-text-muted">· Latest capture</span></p><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full w-[72%] rounded-full" style={{background:data.color}}/></div></div></div><div className="mt-5 flex items-center gap-1.5 text-meta text-text-muted"><Clock3 size={13}/> 5-month comparison <span className="ml-auto inline-flex items-center gap-1" style={{color:data.color}}>{data.trend.startsWith("−")?<ArrowDownRight size={13}/>:<ArrowUpRight size={13}/>} {data.trend} vs baseline</span></div></Card>
      </div>
      <Card><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2"><Waves className="h-4 w-4 text-text-muted"/><CardLabel>Change Regions</CardLabel></div><p className="mt-1 text-meta text-text-muted">Largest detected clusters within the area of interest</p></div><button className="inline-flex items-center gap-1 text-meta text-text-muted hover:text-text-primary"><SlidersHorizontal size={14}/> Sort by area <ChevronDown size={13}/></button></div><div className="grid grid-cols-1 gap-3 md:grid-cols-3">{data.regionList.map((region,index)=><button key={region.name} onClick={()=>setActiveRegion(index)} className={`rounded-control border p-3.5 text-left transition-colors ${activeRegion===index?"border-primary/50 bg-primary/[0.08]":"border-hairline bg-white/[0.02] hover:bg-white/[0.05]"}`}><div className="flex items-start justify-between gap-2"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{background:region.color}}/><p className="text-button-label font-medium text-text-primary">{region.name}</p></div><span className="font-mono text-meta text-text-primary">{region.area}</span></div><p className="mt-2 pl-4 text-meta text-text-muted">{region.detail}</p><div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full" style={{width:`${Math.max(32,88-index*17)}%`,background:region.color}}/></div></button>)}</div><p className="mt-3 flex items-center gap-1.5 text-meta text-text-muted"><CircleHelp size={13}/> Illustrative region samples only. Gemini has no imagery or image processing in this phase.</p></Card>
      <AnimatePresence mode="wait" initial={false}>{isAnalysisPending
        ? <DashboardSkeleton key="analytics-loading" kind="charts"/>
        : <motion.div key="analytics-ready" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.24}}><Suspense fallback={<DashboardSkeleton kind="charts"/>}><AnalyticsPanel analysis={displayAnalysis} year={selectedYear}/></Suspense></motion.div>}
      </AnimatePresence>
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-meta text-text-muted"><span className="inline-flex items-center gap-1.5"><Satellite size={14}/> Smart Earth · Change intelligence</span><span>Analysis ID · SIH26-{data.place.replace(/[^A-Z]/gi,"").slice(0,5).toUpperCase()}-0421</span></div>
      </>}
    </motion.div>
    {isLoading && <div role="status" aria-live="polite" className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-canvas/90 px-section backdrop-blur-glass-strong"><div className="pointer-events-none absolute h-[min(72vw,30rem)] w-[min(72vw,30rem)] rounded-full border border-primary/15"><div className="absolute inset-4 rounded-full border border-primary/10"/><div className="absolute inset-12 rounded-full border border-primary/10"/><motion.div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0_78%,rgba(56,189,248,.35)_100%)]" animate={{rotate:360}} transition={{duration:4,repeat:Infinity,ease:"linear"}}/><motion.div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_35px_12px_rgba(56,189,248,.35)]" animate={{scale:[1,1.7,1],opacity:[.7,1,.7]}} transition={{duration:1.5,repeat:Infinity}}/></div><Card className="relative w-full max-w-md"><div className="mb-4 flex items-center gap-3"><Loader2 className="h-6 w-6 animate-spin text-primary"/><div><p className="text-button-label font-semibold text-text-primary">{stages[loadingStep]}</p><p className="mt-1 text-meta text-text-muted">Preparing query context for Gemini analysis</p></div></div><div className="mb-4 h-1.5 overflow-hidden rounded-pill bg-white/[0.08]"><motion.div className="h-full rounded-pill bg-gradient-to-r from-primary to-secondary" animate={{width:`${((loadingStep+1)/stages.length)*100}%`}} transition={{duration:.25}}/></div><div className="grid grid-cols-2 gap-x-3 gap-y-2">{stages.map((stage,index)=><p key={stage} className={`text-meta ${index<=loadingStep?"text-text-primary":"text-text-muted/50"}`}>{index<loadingStep?"✓":index===loadingStep?"◌":"·"} {stage}</p>)}</div></Card></div>}
    <AnimatePresence>{toast && <motion.div role="status" aria-live="polite" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:8}} className="fixed bottom-5 right-5 z-[60] rounded-control border border-emerald-400/25 bg-surface px-4 py-3 text-meta text-emerald-200 shadow-elevation-3"><Check size={14} className="mr-2 inline"/>{toast}</motion.div>}</AnimatePresence>
  </DashboardLayout>;
}
