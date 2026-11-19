import { useOnlineStatus } from "../hooks/useOnlineStatus.js";

export default function ConnectionStatus() {
  const online = useOnlineStatus();
  return (
    <span className={"conn " + (online ? "online" : "offline")} role="status" aria-live="polite">
      <span className="dot" aria-hidden="true" />
      {online ? "Online" : "Offline"}
    </span>
  );
}
