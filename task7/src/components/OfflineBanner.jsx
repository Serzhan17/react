import { useOnlineStatus } from "../hooks/useOnlineStatus.js";

export default function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div className="banner offline-banner" role="status">
      You are offline. Pages and data you opened before are still available.
    </div>
  );
}
