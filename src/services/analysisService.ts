import { createMockSatelliteImage } from "@/lib/mockSatelliteImage";
import type { MockAnalysis, Severity } from "@/types/analysis";
import { apiRequest, friendlyAPIError } from "@/services/api";
export type { MockAnalysis } from "@/types/analysis";

export interface AnalysisInput {
  query: string; location: string; analysisType: string; timeRange: string; year: number;
  beforeYear?: number; coordinates?: string; satellite?: string; resolution?: string; cloudCoverage?: number;
  confidence?: number; changedAreaKm2?: number; filters?: Record<string, string | number | boolean | string[]>;
}
interface BackendRecommendation { title: string; explanation: string; severity: Severity; category?: string }
interface BackendTimelinePoint { year: number; detected_change: string; confidence: number; affected_area_km2: number; severity: Severity }
interface BackendAnalysis {
  id: string; status: string; summary: string; confidence: number; severity?: Severity;
  affected_area_km2: number; risk: { level: Severity; description: string };
  recommendations: BackendRecommendation[]; detected_changes: string[]; environmental_impact: string;
  infrastructure_impact: string; timeline: BackendTimelinePoint[]; metadata: Record<string, unknown>;
  statistics: { changed_area_km2?: number; aoi_changed_percent?: number; change_region_count?: number; change_type?: string; severity?: Severity; [key: string]: string | number | undefined };
}
interface BackendSavedAnalysis { id: number; analysis_id: string; title: string }
export interface AnalysisServiceResult { analysis: MockAnalysis; source: "backend" | "error"; warning?: string }

export async function analyze(input: AnalysisInput, options: { signal?: AbortSignal } = {}): Promise<AnalysisServiceResult> {
  try {
    const response = await apiRequest<BackendAnalysis>("/api/analyze", {
      method: "POST", timeoutMs: 60_000, retries: 0, signal: options.signal,
      body: {
        location: input.location, changeType: input.analysisType, beforeYear: input.beforeYear ?? input.year - 1,
        afterYear: input.year, filters: { ...input.filters, satellite: input.satellite, resolution: input.resolution,
          cloudCoverage: input.cloudCoverage, timeRange: input.timeRange },
        query: input.query, latitude: coordinatePart(input.coordinates, 0), longitude: coordinatePart(input.coordinates, 1),
        satellite: input.satellite, resolution: input.resolution, cloud_coverage: input.cloudCoverage,
      },
    });
    return { analysis: mapBackendAnalysis(input, response), source: "backend" };
  } catch (error) {
    return { analysis: createUnavailableAnalysis(input), source: "error", warning: friendlyAPIError(error) };
  }
}

function mapBackendAnalysis(input: AnalysisInput, response: BackendAnalysis): MockAnalysis {
  const seed = [...response.id].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7);
  const areaKm2 = response.statistics.changed_area_km2 ?? response.affected_area_km2 ?? 0;
  const changeType = response.statistics.change_type ?? input.analysisType;
  const severity = response.statistics.severity ?? response.severity ?? response.risk.level;
  const beforeYear = input.beforeYear ?? input.year - 1;
  const metadata = {
    analysisId: response.id,
    analysisDate: stringValue(response.metadata.analysisDate, new Date().toISOString().slice(0, 10)),
    processingTime: stringValue(response.metadata.processingTime, "Gemini API"),
    satelliteSource: stringValue(response.metadata.satelliteSource, input.satellite ?? "Not specified"),
    imageryResolution: stringValue(response.metadata.imageryResolution, input.resolution ?? "Not specified"),
    cloudCoverage: stringValue(response.metadata.cloudCoverage, `${input.cloudCoverage ?? 0}%`),
    aiConfidence: `${response.confidence}%`,
    coordinates: stringValue(response.metadata.coordinates, input.coordinates ?? "Not provided"),
    areaSize: `${areaKm2.toFixed(2)} km2`,
    selectedTimeRange: stringValue(response.metadata.selectedTimeRange, input.timeRange),
    modelVersion: stringValue(response.metadata.modelVersion, "Gemini"),
    status: response.status,
  };
  const recommendations = response.recommendations.map((item) => ({ ...item, category: item.category ?? changeType }));
  const timelineData = response.timeline.map((item) => ({
    year: item.year, changeType: item.detected_change, confidence: item.confidence,
    affectedAreaKm2: item.affected_area_km2, severity: item.severity,
  }));
  return {
    changeType, confidence: response.confidence, severity, areaKm2,
    aoiChangedPercent: response.statistics.aoi_changed_percent ?? 0,
    changeRegionCount: response.statistics.change_region_count ?? response.detected_changes.length,
    dateRange: input.timeRange,
    summary: response.summary, recommendations, metadata,
    beforeImage: createMockSatelliteImage(seed, beforeYear), afterImage: createMockSatelliteImage(seed + 53, input.year),
    beforeYear, afterYear: input.year, timelineData,
    exportData: { project: "PS-227 AI-Powered Satellite Change Analysis", query: input.query, location: input.location,
      years: { before: beforeYear, after: input.year }, detectedChanges: response.detected_changes,
      environmentalImpact: response.environmental_impact, infrastructureImpact: response.infrastructure_impact,
      metadata, statistics: response.statistics, confidence: response.confidence, severity, summary: response.summary,
      recommendations, timeline: timelineData },
    status: response.status, seed,
  };
}

export function createUnavailableAnalysis(input: AnalysisInput): MockAnalysis {
  const seed = [...input.query].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7);
  const date = new Date().toISOString().slice(0, 10);
  const status = "Analysis unavailable";
  const metadata = { analysisId: "Not generated", analysisDate: date, processingTime: "—", satelliteSource: input.satellite ?? "—",
    imageryResolution: input.resolution ?? "—", cloudCoverage: `${input.cloudCoverage ?? 0}%`, aiConfidence: "—",
    coordinates: input.coordinates ?? "Not provided", areaSize: "—", selectedTimeRange: input.timeRange,
    modelVersion: "Gemini unavailable", status };
  return { changeType: input.analysisType, confidence: 0, severity: "Low", areaKm2: 0, aoiChangedPercent: 0,
    changeRegionCount: 0, dateRange: input.timeRange,
    summary: "AI analysis could not be completed. Retry when the Gemini backend is available.", recommendations: [], metadata,
    beforeImage: createMockSatelliteImage(seed, input.year - 1), afterImage: createMockSatelliteImage(seed + 53, input.year),
    beforeYear: input.year - 1, afterYear: input.year, timelineData: [], exportData: {}, status, seed };
}

function stringValue(value: unknown, fallback: string): string { return typeof value === "string" ? value : fallback; }
function coordinatePart(value: string | undefined, index: number): number | undefined {
  const parsed = value?.split(",")[index]?.trim(); const number = parsed === undefined ? NaN : Number(parsed);
  return Number.isFinite(number) ? number : undefined;
}

export function saveRemoteAnalysis(analysisId: string, title: string): Promise<BackendSavedAnalysis> {
  return apiRequest<BackendSavedAnalysis>("/save", { method: "POST", body: { analysis_id: analysisId, title } });
}

export function deleteRemoteSavedAnalysis(savedId: number): Promise<{ deleted: boolean; id: number }> {
  return apiRequest<{ deleted: boolean; id: number }>(`/save/${savedId}`, { method: "DELETE" });
}
