import { useState, useEffect } from "react";
import { checkConnection } from "../services/connectivity.js";

// Online/offline state. Browser events give the first hint, a real request to the server confirms it,
// and while offline we keep probing so the app recovers by itself when the connection returns.
export function useOnlineStatus() {
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);

  useEffect(() => {
    let cancelled = false;
    async function handleOnline() {
      const ok = await checkConnection();
      if (!cancelled) setOnline(ok);
    }
    function handleOffline() {
      setOnline(false);
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      cancelled = true;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (online) return;
    let cancelled = false;
    const timer = setInterval(async () => {
      if (await checkConnection()) {
        if (!cancelled) setOnline(true);
      }
    }, 5000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [online]);

  return online;
}
