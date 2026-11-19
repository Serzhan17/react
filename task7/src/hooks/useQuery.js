import { useState, useEffect } from "react";
import { fetchCached, peekEntry, invalidate, DEFAULT_STALE_TIME } from "../services/cache.js";

// Cached, race-safe data fetching.
//  - fresh cache hit  -> data immediately, no request
//  - stale cache hit  -> old data immediately + background revalidation (stale-while-revalidate)
//  - cache miss       -> loading state + request
// The effect cleanup marks old requests as cancelled, so an outdated response is never shown.
export function useQuery(key, fetcher, { staleTime = DEFAULT_STALE_TIME, keepPrevious = false, enabled = true } = {}) {
  const k = JSON.stringify(key);
  const [state, setState] = useState({ k: null, data: null, error: null, loading: true });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const entry = peekEntry(key);
    if (entry && entry.age < staleTime) {
      setState({ k, data: entry.data, error: null, loading: false });
      return;
    }

    setState((prev) => ({
      k,
      data: entry ? entry.data : keepPrevious ? prev.data : null,
      error: null,
      loading: true,
    }));

    fetchCached(key, fetcher, { staleTime })
      .then((data) => {
        if (!cancelled) setState({ k, data, error: null, loading: false });
      })
      .catch((error) => {
        if (!cancelled) setState({ k, data: null, error, loading: false });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k, reloadKey, enabled]);

  // Derive what to show for the CURRENT key during the render, so data of a previous key
  // (e.g. the previous task) is never displayed under a new URL.
  let current = state;
  if (!enabled) {
    current = { k, data: null, error: null, loading: false };
  } else if (state.k !== k) {
    const entry = peekEntry(key);
    if (entry && entry.age < staleTime) current = { k, data: entry.data, error: null, loading: false };
    else if (entry) current = { k, data: entry.data, error: null, loading: true };
    else current = { k, data: keepPrevious ? state.data : null, error: null, loading: true };
  }

  // When the connection returns, data that was served from the offline cache is refreshed automatically.
  const fromCache = Boolean(current.data && current.data.fromCache);
  useEffect(() => {
    if (!fromCache) return;
    const handleOnline = () => {
      invalidate(key);
      setReloadKey((n) => n + 1);
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromCache, k]);

  return {
    data: current.data,
    error: current.error,
    loading: current.loading,
    // "Reload" = throw the cached entry away and fetch again.
    reload: () => {
      invalidate(key);
      setReloadKey((n) => n + 1);
    },
    setData: (updater) =>
      setState((prev) => {
        if (prev.k !== k) return prev;
        return { ...prev, data: typeof updater === "function" ? updater(prev.data) : updater };
      }),
  };
}
