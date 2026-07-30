/**
 * Axios-style HTTP client built on fetch with request/response interceptors,
 * timeout handling, offline detection and normalised API errors.
 */
export type ApiError = {
  message: string;
  code: string;
  status: number;
  fields?: Record<string, string>;
};

export class HttpError extends Error implements ApiError {
  code: string;
  status: number;
  fields?: Record<string, string>;

  constructor(error: ApiError) {
    super(error.message);
    this.name = "HttpError";
    this.code = error.code;
    this.status = error.status;
    this.fields = error.fields;
  }
}

type RequestConfig = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  params?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
  timeoutMs?: number;
  headers?: Record<string, string>;
};

type RequestInterceptor = (url: string, config: RequestConfig) => void;
type ResponseInterceptor = (status: number, url: string) => void;
type ErrorInterceptor = (error: HttpError) => void;

const requestInterceptors: RequestInterceptor[] = [];
const responseInterceptors: ResponseInterceptor[] = [];
const errorInterceptors: ErrorInterceptor[] = [];

export const http = {
  onRequest(fn: RequestInterceptor) {
    requestInterceptors.push(fn);
  },
  onResponse(fn: ResponseInterceptor) {
    responseInterceptors.push(fn);
  },
  onError(fn: ErrorInterceptor) {
    errorInterceptors.push(fn);
  },
  async request<T>(path: string, config: RequestConfig = {}): Promise<T> {
    const { method = "GET", body, params, timeoutMs = 20000, headers = {}, signal } = config;

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      const offline = new HttpError({ message: "You are offline — showing cached data", code: "offline", status: 0 });
      errorInterceptors.forEach((fn) => fn(offline));
      throw offline;
    }

    const query = params
      ? `?${new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== "")
            .map(([k, v]) => [k, String(v)]),
        ).toString()}`
      : "";
    const url = `/api${path}${query}`;
    requestInterceptors.forEach((fn) => fn(url, config));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    if (signal) signal.addEventListener("abort", () => controller.abort());

    try {
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json", ...headers },
        body: body === undefined ? undefined : JSON.stringify(body),
        credentials: "include",
        signal: controller.signal,
        cache: "no-store",
      });
      responseInterceptors.forEach((fn) => fn(res.status, url));

      const payload = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        data?: T;
        error?: { message: string; code: string; fields?: Record<string, string> };
      };

      if (!res.ok || payload.success === false) {
        const error = new HttpError({
          message: payload.error?.message ?? `Request failed with status ${res.status}`,
          code: payload.error?.code ?? "request_failed",
          status: res.status,
          fields: payload.error?.fields,
        });
        errorInterceptors.forEach((fn) => fn(error));
        throw error;
      }

      return payload.data as T;
    } catch (error) {
      if (error instanceof HttpError) throw error;
      const normalized = new HttpError({
        message:
          error instanceof DOMException && error.name === "AbortError"
            ? "Request timed out — the AI gateway is not responding"
            : "Network failure — retrying on next poll",
        code: "network_error",
        status: 0,
      });
      errorInterceptors.forEach((fn) => fn(normalized));
      throw normalized;
    } finally {
      clearTimeout(timeout);
    }
  },
  get<T>(path: string, params?: RequestConfig["params"], config?: RequestConfig) {
    return http.request<T>(path, { ...config, method: "GET", params });
  },
  post<T>(path: string, body?: unknown, config?: RequestConfig) {
    return http.request<T>(path, { ...config, method: "POST", body });
  },
  patch<T>(path: string, body?: unknown, config?: RequestConfig) {
    return http.request<T>(path, { ...config, method: "PATCH", body });
  },
  put<T>(path: string, body?: unknown, config?: RequestConfig) {
    return http.request<T>(path, { ...config, method: "PUT", body });
  },
  delete<T>(path: string, config?: RequestConfig) {
    return http.request<T>(path, { ...config, method: "DELETE" });
  },
};
