export function getInsightValues(seed: number) {
  const labels = ["Urban Expansion", "Vegetation Loss", "Water Body Change", "Flood Risk", "Construction Activity", "Fire Damage", "Mining Activity"];
  const trends = ["upward", "downward", "stable"];
  return labels.map((label, index) => ({ label, value: 3 + ((seed >>> (index % 4) * 5) + index * 17) % 86, trend: trends[index % 3], description: ["Built-up footprint", "Canopy cover signal", "Surface water extent", "Inundation indicator", "New developed surfaces", "Burn scar indicator", "Disturbed land signal"][index] }));
}
