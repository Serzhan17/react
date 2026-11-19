import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate({ email, password, confirm }) {
  const errors = {};
  if (!EMAIL_RE.test(email.trim())) errors.email = "Enter a valid email address.";
  if (password.length < 6) errors.password = "Password must be at least 6 characters.";
  if (confirm !== password) errors.confirm = "Passwords do not match.";
  return errors;
}

export default function Signup() {
  useDocumentTitle("Sign up");
  const { user, loading, error, clearError, signup, loginWithGoogle, configured } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <p className="placeholder" aria-busy="true">Checking session…</p>;
  if (user) return <Navigate to="/profile" replace />;

  function change(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setBusy(true);
    await signup(form.email.trim(), form.password);
    setBusy(false);
  }

  async function handleGoogle() {
    setBusy(true);
    await loginWithGoogle();
    setBusy(false);
  }

  return (
    <section className="panel login">
      <h1>Create account</h1>
      {!configured && (
        <p className="error" role="alert">
          Firebase is not configured. Copy <code>.env.example</code> to <code>.env.local</code> and fill in your keys.
        </p>
      )}
      <form className="form" onSubmit={handleSubmit} noValidate>
        <label>
          Email
          <input type="email" value={form.email} onChange={(e) => change("email", e.target.value)} autoComplete="email" />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </label>
        <label>
          Password
          <input type="password" value={form.password} onChange={(e) => change("password", e.target.value)} autoComplete="new-password" />
          {errors.password && <span className="field-error">{errors.password}</span>}
        </label>
        <label>
          Confirm password
          <input type="password" value={form.confirm} onChange={(e) => change("confirm", e.target.value)} autoComplete="new-password" />
          {errors.confirm && <span className="field-error">{errors.confirm}</span>}
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" className="primary" disabled={busy}>{busy ? "Please wait…" : "Sign up"}</button>
      </form>
      <div className="divider"><span>or</span></div>
      <button type="button" className="google" onClick={handleGoogle} disabled={busy}>
        <span aria-hidden="true">G</span> Sign up with Google
      </button>
      <p className="muted">Already have an account? <Link to="/login">Log in</Link></p>
    </section>
  );
}
