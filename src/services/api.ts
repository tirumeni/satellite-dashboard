export class APIError extends Error {
  constructor(message: string, public readonly code: string, public readonly status?: number, public readonly details?: unknown) { super(message); this.name = "APIError"; }
}
export class ValidationError extends APIError { constructor(message: string, details?: unknown) { super(message, "VALIDATION", 422, details); this.name = "ValidationError"; } }
export class NetworkError extends APIError { constructor(message = "The analysis service could not be reached.") { super(message, "NETWORK"); this.name = "NetworkError"; } }
export class DatabaseError extends APIError { constructor(message = "The analysis service could not save or load data.", status?: number) { super(message, "DATABASE", status); this.name = "DatabaseError"; } }

const baseUrl = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
export interface RequestOptions { method?: "GET" | "POST" | "DELETE"; body?: unknown; timeoutMs?: number; retries?: number; signal?: AbortSignal }

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, timeoutMs = 1800, retries = 1, signal } = options;
  let lastError: APIError = new NetworkError();
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController(); let timedOut = false;
    const timeout = window.setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
    const abortFromCaller = () => controller.abort(); signal?.addEventListener("abort", abortFromCaller, { once: true });
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method, signal: controller.signal,
        headers: { Accept: "application/json", ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const detail = typeof payload === "object" && payload !== null && "detail" in payload ? String((payload as { detail: unknown }).detail) : `Request failed (${response.status}).`;
        if (response.status === 422) throw new ValidationError(detail, payload);
        if ([502, 503].includes(response.status)) throw new APIError(detail, "AI_UNAVAILABLE", response.status, payload);
        if (response.status >= 500) throw new DatabaseError(detail, response.status);
        throw new APIError(detail, "HTTP", response.status, payload);
      }
      return payload as T;
    } catch (error) {
      if (error instanceof APIError) lastError = error;
      else if (timedOut) lastError = new APIError("The request timed out.", "TIMEOUT");
      else if (signal?.aborted) throw new APIError("The request was cancelled.", "ABORTED");
      else lastError = new NetworkError();
      const retryable = lastError.code === "NETWORK" || lastError.code === "TIMEOUT" || lastError.code === "DATABASE";
      if (!retryable || attempt >= retries) throw lastError;
      await new Promise((resolve) => window.setTimeout(resolve, 250 * (attempt + 1)));
    } finally { window.clearTimeout(timeout); signal?.removeEventListener("abort", abortFromCaller); }
  }
  throw lastError;
}

export function friendlyAPIError(error: unknown): string {
  if (error instanceof APIError && error.code === "AI_UNAVAILABLE") return error.message;
  if (error instanceof APIError && [400, 401, 403, 429].includes(error.status ?? 0)) return error.message;
  if (error instanceof ValidationError) return "Please check the location and analysis details, then try again.";
  if (error instanceof APIError && error.code === "TIMEOUT") return "Gemini analysis took too long to respond. Please retry.";
  if (error instanceof NetworkError || (error instanceof APIError && error.code === "NETWORK")) return "The analysis service could not be reached. Check that the backend is running, then retry.";
  if (error instanceof DatabaseError) return "The backend encountered an internal error. Please retry the analysis.";
  return "Gemini analysis could not be completed. Please retry.";
}
