import { apiRequest, friendlyAPIError } from "@/services/api";

export interface SearchHistoryRecord { id: number; location: string; analysis_type: string; time_range: string; original_query: string; timestamp: string }
export async function getHistory(options: { signal?: AbortSignal } = {}): Promise<SearchHistoryRecord[]> {
  return apiRequest<SearchHistoryRecord[]>("/history", { signal: options.signal });
}
export async function recordHistory(entry: Omit<SearchHistoryRecord, "id" | "timestamp">): Promise<{ saved: boolean; warning?: string }> {
  try { await apiRequest<SearchHistoryRecord>("/history", { method: "POST", body: entry, retries: 0 }); return { saved: true }; }
  catch (error) { return { saved: false, warning: friendlyAPIError(error) }; }
}
