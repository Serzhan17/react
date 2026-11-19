// Service Worker registration, update handling and the install prompt.
let waitingRegistration = null;
let updateRequested = false;
const updateListeners = new Set();

let deferredInstallPrompt = null;
const installListeners = new Set();

function notifyUpdate() {
  updateListeners.forEach((cb) => cb(Boolean(waitingRegistration)));
}
function notifyInstall() {
  installListeners.forEach((cb) => cb(Boolean(deferredInstallPrompt)));
}

export function subscribeToUpdate(callback) {
  updateListeners.add(callback);
  callback(Boolean(waitingRegistration));
  return () => {
    updateListeners.delete(callback);
  };
}

export function registerServiceWorker() {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return; // only in the production build

  // Reload once the new worker has taken control — but only if the user asked for the update
  // (the very first install also fires controllerchange and must not reload the page).
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (updateRequested) window.location.reload();
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        const checkWaiting = () => {
          // A waiting worker + an active controller = a new version is ready (not the first install).
          if (registration.waiting && navigator.serviceWorker.controller) {
            waitingRegistration = registration;
            notifyUpdate();
          }
        };
        checkWaiting();

        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (worker.state === "installed") checkWaiting();
          });
        });

        const checkForUpdate = () => registration.update().catch(() => {});
        document.addEventListener("visibilitychange", () => {
          if (!document.hidden) checkForUpdate();
        });
        setInterval(checkForUpdate, 60 * 60 * 1000);
      })
      .catch((error) => console.error("Service worker registration failed:", error));
  });
}

// Called by the "Update" button.
export function applyUpdate() {
  if (!waitingRegistration || !waitingRegistration.waiting) return;
  updateRequested = true;
  waitingRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
}

/* ---- install prompt (beforeinstallprompt) ---- */
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    notifyInstall();
  });
  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    notifyInstall();
  });
}

export function subscribeToInstall(callback) {
  installListeners.add(callback);
  callback(Boolean(deferredInstallPrompt));
  return () => {
    installListeners.delete(callback);
  };
}

export async function promptInstall() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  notifyInstall();
}
