import { useState, useEffect } from "react";

// Runs an async function inside useEffect and exposes { data, error, loading }.
// Race-condition safe: the cleanup marks the previous request as cancelled,
// so a late response of an old request can never overwrite newer data.
export function useAsync(asyncFn, deps, { keepPrevious = false } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ data: keepPrevious ? prev.data : null, error: null, loading: true }));

    asyncFn()
      .then((data) => {
        if (!cancelled) setState({ data, error: null, loading: false });
      })
      .catch((error) => {
        if (!cancelled) setState({ data: null, error, loading: false });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey]);

  return {
    ...state,
    reload: () => setReloadKey((k) => k + 1),
    setData: (updater) =>
      setState((prev) => ({
        ...prev,
        data: typeof updater === "function" ? updater(prev.data) : updater,
      })),
  };
}
