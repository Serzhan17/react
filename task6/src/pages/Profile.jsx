import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

// Rendered only inside <ProtectedRoute>, so `user` is always set here.
export default function Profile() {
  useDocumentTitle("Profile");
  const { user, logout, error } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    setBusy(true);
    const ok = await logout();
    setBusy(false);
    if (ok) navigate("/login", { replace: true });
  }

  const provider = user.providerData[0]?.providerId === "google.com" ? "Google" : "Email / Password";

  return (
    <section className="panel prose">
      <h1>Profile</h1>
      <dl className="fields">
        <dt>Email</dt>
        <dd>{user.email}</dd>
        <dt>UID</dt>
        <dd className="mono">{user.uid}</dd>
        <dt>Sign-in method</dt>
        <dd>{provider}</dd>
        <dt>Last sign-in</dt>
        <dd>{user.metadata?.lastSignInTime || "—"}</dd>
      </dl>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="actions">
        <button className="danger" onClick={handleLogout} disabled={busy}>{busy ? "Logging out…" : "Log out"}</button>
      </div>
    </section>
  );
}
