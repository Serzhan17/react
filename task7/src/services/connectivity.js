// Real connectivity probe. navigator.onLine only says "a network interface exists",
// so we ask the server. The "__ping" parameter makes the Service Worker skip its caches.
export async function checkConnection() {
  try {
    const response = await fetch(`/ping.txt?__ping=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return false;
    return (await response.text()).trim() === "ok";
  } catch {
    return false;
  }
}
