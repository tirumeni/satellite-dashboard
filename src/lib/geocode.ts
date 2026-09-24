export interface GeocodedLocation {
  lat: number;
  lng: number;
  name: string;
}

interface NominatimSearchResult {
  lat: string;
  lon: string;
  display_name: string;
}

interface NominatimReverseResult {
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  address?: Record<string, string>;
}

const BASE_URL = "https://nominatim.openstreetmap.org";
const CACHE_LIMIT = 100;
const MIN_REQUEST_INTERVAL_MS = 1100;
const resultCache = new Map<string, GeocodedLocation | null>();
let requestQueue: Promise<void> = Promise.resolve();
let lastRequestAt = 0;

const SUGGESTIBLE_PLACES = [
  "Chennai", "Chengalpattu", "Chennai Airport", "Coimbatore", "Bengaluru",
  "Goa", "Northern California", "California", "Amazon Rainforest",
  "Amazon River", "Western Ghats", "Nilgiri Hills", "Mumbai", "Delhi",
  "Hyderabad", "Kolkata", "Pune", "Jaipur", "Kerala", "Tamil Nadu",
  "India", "Dubai", "Sacramento", "Manaus", "Mount Everest",
];

const LEADING_INTENT = /^(?:please\s+)?(?:show|find|search\s+for|analyze|analyse|monitor|detect|compare|map|track|locate)\s+/i;
const CHANGE_TERMS = /^(?:(?:urban\s+expansion|urban\s+growth|flood(?:\s+detection)?|deforestation|wildfire(?:\s+damage)?|fire\s+damage|mining(?:\s+activity)?|road\s+construction|vegetation\s+(?:change|loss)|water\s+change|land\s+cover\s+change|change\s+detection|damage|changes?)\s*)+/i;
const COORDINATE_PATTERN = /^\s*(-?\d{1,2}(?:\.\d+)?)\s*[,; ]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/;

export function parseCoordinates(query: string): GeocodedLocation | null {
  const match = query.match(COORDINATE_PATTERN);
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng, name: "Selected coordinates" };
}

/** Extracts the place phrase before forwarding a natural-language query to Nominatim. */
export function extractLocation(query: string): string {
  const trimmed = query.trim();
  if (!trimmed || parseCoordinates(trimmed)) return trimmed;

  let place = trimmed
    .replace(LEADING_INTENT, "")
    .replace(/\b(?:after|before|since|during|between)\b.*$/i, "")
    .trim();

  const relation = place.match(/\b(?:near|around|in|at|within|across|over|along|by)\s+(.+)$/i);
  if (relation?.[1]) place = relation[1].trim();
  else place = place.replace(CHANGE_TERMS, "").trim();

  return place.replace(/^[,\s]+|[,\s]+$/g, "") || trimmed;
}

export function getLocationSuggestions(input: string, limit = 5): string[] {
  const prefix = extractLocation(input).toLocaleLowerCase();
  if (!prefix || prefix === input.trim().toLocaleLowerCase() && input.trim().length < 2) return [];
  return SUGGESTIBLE_PLACES
    .filter((place) => place.toLocaleLowerCase().startsWith(prefix))
    .slice(0, limit);
}

/** Returns a nearby known place for a helpful no-result message. */
export function getClosestLocationSuggestion(input: string): string | null {
  const value = input.trim().toLocaleLowerCase();
  if (!value) return null;
  const prefixMatch = getLocationSuggestions(input, 1)[0];
  if (prefixMatch) return prefixMatch;
  const distance = (left: string, right: string) => {
    const row = Array.from({ length: right.length + 1 }, (_, index) => index);
    for (let i = 1; i <= left.length; i++) {
      let diagonal = row[0]; row[0] = i;
      for (let j = 1; j <= right.length; j++) {
        const above = row[j];
        row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (left[i - 1] === right[j - 1] ? 0 : 1));
        diagonal = above;
      }
    }
    return row[right.length];
  };
  const closest = SUGGESTIBLE_PLACES.map((place) => ({ place, score: distance(value, place.toLocaleLowerCase()) }))
    .sort((a, b) => a.score - b.score)[0];
  return closest && closest.score <= Math.max(2, Math.floor(value.length * 0.28)) ? closest.place : null;
}

function cacheResult(key: string, value: GeocodedLocation | null): void {
  resultCache.delete(key);
  resultCache.set(key, value);
  if (resultCache.size > CACHE_LIMIT) {
    const oldest = resultCache.keys().next().value;
    if (oldest) resultCache.delete(oldest);
  }
}

async function rateLimitedJson<T>(url: string): Promise<T> {
  let resolveRequest!: (value: T) => void;
  let rejectRequest!: (reason?: unknown) => void;
  const responsePromise = new Promise<T>((resolve, reject) => {
    resolveRequest = resolve;
    rejectRequest = reject;
  });

  requestQueue = requestQueue.then(async () => {
    const wait = Math.max(0, lastRequestAt + MIN_REQUEST_INTERVAL_MS - Date.now());
    if (wait) await new Promise((resolve) => window.setTimeout(resolve, wait));
    lastRequestAt = Date.now();
    try {
      const response = await fetch(url, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`Geocoding service returned ${response.status}.`);
      resolveRequest((await response.json()) as T);
    } catch (error) {
      rejectRequest(error);
    }
  });

  return responsePromise;
}

export async function geocodeLocation(query: string): Promise<GeocodedLocation | null> {
  const locationQuery = extractLocation(query);
  const coordinates = parseCoordinates(locationQuery);
  if (coordinates) return coordinates;
  if (!locationQuery) return null;

  const key = `search:${locationQuery.toLocaleLowerCase()}`;
  if (resultCache.has(key)) return resultCache.get(key) ?? null;

  const params = new URLSearchParams({
    format: "jsonv2",
    q: locationQuery,
    limit: "1",
    addressdetails: "1",
  });
  const results = await rateLimitedJson<NominatimSearchResult[]>(`${BASE_URL}/search?${params}`);
  const result = results[0];
  const location = result
    ? { lat: Number(result.lat), lng: Number(result.lon), name: result.display_name }
    : null;
  cacheResult(key, location);
  return location;
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodedLocation> {
  const key = `reverse:${lat.toFixed(5)},${lng.toFixed(5)}`;
  const cached = resultCache.get(key);
  if (cached) return cached;

  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(lat),
    lon: String(lng),
    zoom: "16",
    addressdetails: "1",
  });
  const result = await rateLimitedJson<NominatimReverseResult>(`${BASE_URL}/reverse?${params}`);
  const location = {
    lat,
    lng,
    name: result.name || result.address?.city || result.address?.town || result.address?.village || result.display_name || "Selected location",
  };
  cacheResult(key, location);
  return location;
}
