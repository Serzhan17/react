import { useState, useEffect } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

export default function Login() {
  useDocumentTitle("Login");
  const { user, loading, error, clearError, login, loginWithGoogle, configured } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fromLocation = location.state?.from;
  const redirectTo = fromLocation ? fromLocation.pathname + (fromLocation.search || "") : "/profile";

  if (loading) return <p className="placeholder" aria-busy="true">Checking session…</p>;
  if (user) return <Navigate to={redirectTo} replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    await login(email.trim(), password);
    setBusy(false);
  }

  async function handleGoogle() {
    setBusy(true);
    await loginWithGoogle();
    setBusy(false);
  }

  return (
    <section className="panel login">
      <h1>Log in</h1>
      {fromLocation && <p className="info">Please log in to view that page.</p>}
      {!configured && (
        <p className="error" role="alert">
          Firebase is not configured. Copy <code>.env.example</code> to <code>.env.local</code> and fill in your keys.
        </p>
      )}
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" className="primary" disabled={busy}>{busy ? "Please wait…" : "Log in"}</button>
      </form>
      <div className="divider"><span>or</span></div>
      <button type="button" className="google" onClick={handleGoogle} disabled={busy}>
        <span aria-hidden="true">G</span> Continue with Google
      </button>
      <p className="muted">No account yet? <Link to="/signup">Sign up</Link></p>
    </section>
  );
}
