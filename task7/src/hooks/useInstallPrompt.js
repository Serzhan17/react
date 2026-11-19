import { useState, useEffect } from "react";
import { subscribeToInstall, promptInstall } from "../services/pwa.js";

export function useInstallPrompt() {
  const [canInstall, setCanInstall] = useState(false);
  useEffect(() => subscribeToInstall(setCanInstall), []);
  return { canInstall, install: promptInstall };
}
