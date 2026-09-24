import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "../api/client";
import { fetchContactSearch } from "../api/contactSearch";
import type { ContactSearchParams, ContactSearchResponse } from "../types/contact";

interface UseContactSearchResult {
  data: ContactSearchResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useContactSearch(params: ContactSearchParams): UseContactSearchResult {
  const [data, setData] = useState<ContactSearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const latestRequestId = useRef(0);

  const paramsKey = JSON.stringify(params);

  const load = useCallback(() => {
    const requestId = ++latestRequestId.current;
    setLoading(true);
    setError(null);

    fetchContactSearch(params)
      .then((result) => {
        if (latestRequestId.current === requestId) {
          setData(result);
        }
      })
      .catch((err: unknown) => {
        if (latestRequestId.current === requestId) {
          setError(err instanceof ApiError ? err.message : "Failed to load contacts.");
        }
      })
      .finally(() => {
        if (latestRequestId.current === requestId) {
          setLoading(false);
        }
      });
    // paramsKey is the stable, deep-equal proxy for params
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load };
}
