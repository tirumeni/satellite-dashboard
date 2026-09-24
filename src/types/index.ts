/**
 * Shared domain types for the satellite change-detection dashboard.
 *
 * These mirror the API response contract defined in the UI/UX plan
 * ("Member 6's Main Deliverable"). Phase 1 does not consume live data —
 * these types exist so later phases (map, stats, summary) can be typed
 * against a stable contract from day one.
 */

export type ChangeType =
  | "vegetation_loss"
  | "water_change"
  | "builtup_expansion"
  | "other";

export interface ChangeAnalysisResult {
  query: string;
  location: string;
  start_date: string;
  end_date: string;
  change_type: ChangeType;
  changed_area_ha: number;
  change_percentage: number;
  confidence: number;
  before_url: string;
  after_url: string;
  change_geojson: GeoJSON.FeatureCollection | null;
}

export interface QueryInterpretation {
  location: string;
  changeType: ChangeType;
  startDate: string;
  endDate: string;
  radiusKm: number;
}

export type ProcessingStepStatus = "pending" | "active" | "done" | "error";

export interface ProcessingStep {
  id: string;
  label: string;
  status: ProcessingStepStatus;
}
