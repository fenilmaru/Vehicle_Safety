"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HttpError } from "@/api/httpClient";

type Options = { pollMs?: number; enabled?: boolean; deps?: unknown[] };

export function useApi<T>(fetcher: () => Promise<T>, { pollMs = 0, enabled = true, deps = [] }: Options = {}) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<HttpError | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [offline, setOffline] = useState(false);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(async () => {
    try {
      const result = await fetcherRef.current();
      setData(result);
      setError(null);
      setOffline(false);
    } catch (err) {
      const normalized = err instanceof HttpError ? err : new HttpError({ message: "Unexpected error", code: "unknown", status: 0 });
      setError(normalized);
      if (normalized.code === "offline" || normalized.code === "network_error") setOffline(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    setLoading((prev) => prev && true);
    void run();
    if (!pollMs) return;
    const id = setInterval(run, pollMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, pollMs, run, ...deps]);

  return { data, error, loading, offline, refetch: run, setData };
}
