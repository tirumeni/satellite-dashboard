export interface MockAcquisitionInfo {
  year: number;
  acquisitionDate: string;
  cloudCover: string;
  resolution: string;
  satelliteName: string;
}

export const comparisonYears = [2019, 2020, 2021, 2022, 2023, 2024, 2025] as const;

export const mockAcquisitionData: Record<number, MockAcquisitionInfo> = {
  2019: { year: 2019, acquisitionDate: "18 Jun 2019", cloudCover: "14%", resolution: "10 m", satelliteName: "Sentinel-2A" },
  2020: { year: 2020, acquisitionDate: "22 Jun 2020", cloudCover: "8%", resolution: "10 m", satelliteName: "Sentinel-2B" },
  2021: { year: 2021, acquisitionDate: "16 Jun 2021", cloudCover: "11%", resolution: "10 m", satelliteName: "Sentinel-2A" },
  2022: { year: 2022, acquisitionDate: "21 Jun 2022", cloudCover: "6%", resolution: "10 m", satelliteName: "Sentinel-2B" },
  2023: { year: 2023, acquisitionDate: "19 Jun 2023", cloudCover: "13%", resolution: "10 m", satelliteName: "Sentinel-2A" },
  2024: { year: 2024, acquisitionDate: "24 Jun 2024", cloudCover: "9%", resolution: "10 m", satelliteName: "Sentinel-2B" },
  2025: { year: 2025, acquisitionDate: "22 Jun 2025", cloudCover: "7%", resolution: "10 m", satelliteName: "Sentinel-2A" },
};

export function getMockAcquisitionInfo(year: number): MockAcquisitionInfo {
  return mockAcquisitionData[year] ?? mockAcquisitionData[2025];
}
