export type AnalysisType = "construction" | "wildfire" | "flood" | "mining" | "urban expansion" | "vegetation" | "water" | "deforestation" | "roads" | "agriculture";
export type TimePeriod = "this year" | "last year" | "since YYYY" | "after YYYY" | "before YYYY" | "between YYYY and YYYY" | "last month" | "last week" | "past 6 months" | "recent imagery";
export interface ParsedSatelliteQuery {
  location: string;
  analysisType: AnalysisType | "change detection";
  timeRange: string;
  originalQuery: string;
  confidence: number;
}

const typePatterns: Array<[AnalysisType, RegExp]> = [
  ["urban expansion", /\burban(?:\s+(?:expansion|growth|sprawl))?\b/i],
  ["wildfire", /\b(?:wildfires?|forest fires?|burn(?:ed)? area|fire damage)\b/i],
  ["flood", /\b(?:flood(?:ing|s)?|inundation)\b/i],
  ["mining", /\b(?:mining|quarry(?:ing)?|excavation)\b/i],
  ["construction", /\b(?:construction|building activity|new buildings?)\b/i],
  ["vegetation", /\b(?:vegetation|canopy|plant cover)\b/i],
  ["water", /\b(?:water|waterbody|water body|reservoir|lake)\b/i],
  ["deforestation", /\b(?:deforestation|forest loss|tree cover loss|logging)\b/i],
  ["roads", /\b(?:roads?|road construction|highways?|transport corridors?)\b/i],
  ["agriculture", /\b(?:agriculture|agricultural|cropland|farmland|crops?)\b/i],
];
const timePatterns: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
  [/\bbetween\s+(\d{4})\s+and\s+(\d{4})\b/i, m => `between ${m[1]} and ${m[2]}`],
  [/\b(since|after|before)\s+(\d{4})\b/i, m => `${m[1].toLowerCase()} ${m[2]}`],
  [/\bthis\s+year\b/i, () => "this year"], [/\blast\s+year\b/i, () => "last year"],
  [/\blast\s+month\b/i, () => "last month"], [/\blast\s+week\b/i, () => "last week"],
  [/\b(?:past|last)\s+(?:six|6)\s+months\b/i, () => "past 6 months"],
];
const stripIntent = /\b(?:please|show|find|search|analy[sz]e|monitor|detect|compare|map|track|locate|identify|me|the|satellite|imagery|images?|changes?|change|detection|loss|risk|impact|recent|latest|current|level|levels|body|in|of|for|around|across|near|over|within|on|at|from|to|area|region|damage|activity|extent|pattern|and)\b/gi;
const COORDS = /^\s*-?\d{1,2}(?:\.\d+)?\s*[,; ]\s*-?\d{1,3}(?:\.\d+)?\s*$/;

export function parseSatelliteQuery(input: string): ParsedSatelliteQuery {
  const originalQuery = input.trim().replace(/\s+/g, " ");
  const normalized = originalQuery.toLowerCase();
  const matchedType = /\b(?:roads?|road construction|highways?|transport corridors?)\b/i.test(normalized)
    ? "roads"
    : typePatterns.find(([, pattern]) => pattern.test(normalized))?.[0] ?? "change detection";
  let timeRange = "recent imagery";
  let timeMatch: RegExpMatchArray | null = null;
  for (const [pattern, format] of timePatterns) {
    const match = normalized.match(pattern);
    if (match) { timeRange = format(match); timeMatch = match; break; }
  }

  let location = originalQuery;
  if (COORDS.test(location)) {
    // Keep coordinates intact for direct map centering.
  } else {
    location = location.replace(/^\s*(?:(?:please\s+)?(?:show|find|search(?:\s+for)?|analy[sz]e|monitor|detect|compare|map|track|locate|identify)\s+)/i, "");
    if (timeMatch?.[0]) location = location.replace(new RegExp(escapeRegExp(timeMatch[0]), "i"), " ");
    location = location.replace(/\b(?:land\s+cover(?:\s+change)?|surface\s+change)\b/gi, " ");
    for (const [, pattern] of typePatterns) location = location.replace(pattern, " ");
    // A relational phrase marks the beginning of the place in common user queries.
    const relation = location.match(/\b(?:near|around|in|at|across|over|within|along|by)\s+(.+)$/i);
    if (relation?.[1]) location = relation[1];
    location = location.replace(stripIntent, " ").replace(/[,:;!?()]/g, " ").replace(/\s+/g, " ").trim();
    location = location.replace(/^(?:the\s+)?(?:region|area)\s+/i, "").trim();
  }
  const confidence = location ? (matchedType !== "change detection" && timeRange !== "recent imagery" ? 0.96 : matchedType !== "change detection" || timeRange !== "recent imagery" ? 0.89 : 0.78) : 0.25;
  return { location, analysisType: matchedType, timeRange, originalQuery, confidence };
}

function escapeRegExp(value: string): string { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

export const EXAMPLE_QUERIES = [
  "Show construction near Chennai this year",
  "Wildfire damage in Northern California after 2020",
  "Flood extent around Bengaluru last month",
  "Deforestation in Amazon Rainforest since 2021",
  "Mining activity near Goa between 2022 and 2025",
  "Urban expansion in Dubai past 6 months",
  "Agricultural change across Tamil Nadu last year",
];

export function getSmartQuerySuggestions(input: string, recentQueries: string[] = [], limit = 6): string[] {
  const value = input.trim().toLocaleLowerCase();
  if (value.length < 2) return [];
  const candidates = [...recentQueries, ...EXAMPLE_QUERIES];
  return [...new Set(candidates)].filter(query => query.toLocaleLowerCase().includes(value)).slice(0, limit);
}
