export type Severity = "Low" | "Moderate" | "High";
export type MockRecommendation = { title: string; explanation: string; severity: Severity; category: string };
export type TimelineRecord = { year: number; changeType: string; confidence: number; affectedAreaKm2: number; severity: Severity };
export interface AnalysisTimelineEntry {
  year: number;
  acquisitionDate: string;
  confidence: number;
  cloudCover: string;
  severity: Severity;
  satelliteSource: string;
  affectedAreaKm2: number;
}
export type AnalysisMetadata = {
  analysisId: string; analysisDate: string; processingTime: string; satelliteSource: string;
  imageryResolution: string; cloudCoverage: string; aiConfidence: string; coordinates: string;
  areaSize: string; selectedTimeRange: string; modelVersion: string; status: string;
};
export type MockAnalysis = {
  changeType: string; confidence: number; severity: Severity; areaKm2: number; dateRange: string;
  aoiChangedPercent: number; changeRegionCount: number;
  summary: string; recommendations: MockRecommendation[]; metadata: AnalysisMetadata;
  beforeImage: string; afterImage: string; beforeYear: number; afterYear: number;
  timelineData: TimelineRecord[]; exportData: Record<string, unknown>; status: string; seed: number;
};
