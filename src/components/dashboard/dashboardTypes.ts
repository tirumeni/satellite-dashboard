export interface DashboardFilters {
  dateRange: string;
  cloud: number;
  satellite: string;
  resolution: string;
  changeTypes: string[];
  confidence: string;
  area: number;
}

export const defaultFilters: DashboardFilters = {
  dateRange: "Jan – Jun 2025",
  cloud: 30,
  satellite: "Sentinel-2",
  resolution: "10m",
  changeTypes: [],
  confidence: "All",
  area: 0,
};
