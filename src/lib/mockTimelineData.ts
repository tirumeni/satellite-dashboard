import type { AnalysisTimelineEntry, Severity } from "@/types/analysis";

const YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025] as const;
const SATELLITES = ["Sentinel-2", "Landsat 8", "Sentinel-2", "Sentinel-1", "Sentinel-2", "Landsat 9", "Sentinel-2"] as const;
const ACQUISITION_DATES = [
  "18 Jun 2019", "22 Jun 2020", "16 Jun 2021", "21 Jun 2022", "19 Jun 2023", "24 Jun 2024", "22 Jun 2025",
] as const;

function hashText(value: string): number {
  return [...value].reduce((hash, char) => (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0, 7);
}

export function createMockTimelineHistory(
  location: string,
  analysisType: string,
  referenceAreaKm2: number,
): AnalysisTimelineEntry[] {
  const seed = hashText(`${location}:${analysisType}`);
  const baseArea = Number.isFinite(referenceAreaKm2) && referenceAreaKm2 > 0 ? referenceAreaKm2 : 24;

  return YEARS.map((year, index) => {
    const variation = 0.48 + index * 0.085 + ((seed >>> (index % 16)) % 8) / 100;
    const affectedAreaKm2 = Number((baseArea * variation).toFixed(2));
    const confidence = 84 + ((seed >>> ((index * 3) % 24)) % 15);
    const cloud = 6 + ((seed >>> ((index * 2 + 5) % 24)) % 29);
    const severity: Severity = affectedAreaKm2 >= 60 ? "High" : affectedAreaKm2 >= 22 ? "Moderate" : "Low";

    return {
      year,
      acquisitionDate: ACQUISITION_DATES[index],
      confidence,
      cloudCover: `${cloud}%`,
      severity,
      satelliteSource: SATELLITES[index],
      affectedAreaKm2,
    };
  });
}
