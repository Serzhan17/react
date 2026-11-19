import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useOnlineStatus } from "../hooks/useOnlineStatus.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { checkConnection } from "../services/connectivity.js";

// /offline — the app shell and this page are pre-cached, so it opens without a connection.
export default function Offline() {
  useDocumentTitle("Offline");
  const navigate = useNavigate();
  const location = useLocation();
  const online = useOnlineStatus();
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState("");

  const from = location.state?.from;
  const target = from ? from.pathname + (from.search || "") : "/";

  // The connection came back: return to the page the user wanted.
  useEffect(() => {
    if (online && from) navigate(target, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  async function retry() {
    setChecking(true);
    setMessage("");
    const ok = await checkConnection(); // a real request, not just navigator.onLine
    setChecking(false);
    if (ok) navigate(target, { replace: true });
    else setMessage("Still offline. Check your connection and try again.");
  }

  return (
    <section className="panel offline-page">
      <div className="offline-icon" aria-hidden="true">📡</div>
      <h1>You're offline</h1>
      <p className="muted">
        This page needs an internet connection and has not been saved on your device yet.
        Pages and data you opened before are still available.
      </p>
      {online && <p className="info" role="status">The connection is back!</p>}
      {message && <p className="error" role="alert">{message}</p>}
      <div className="actions center-actions">
        <button className="primary" onClick={retry} disabled={checking}>
          {checking ? "Checking…" : "Retry connection"}
        </button>
        <Link to="/tasks" className="btn">Open saved tasks</Link>
      </div>
    </section>
  );
}
