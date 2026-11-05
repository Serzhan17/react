import { useState } from "react";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

export default function Login() {
  useDocumentTitle("Login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setMessage("Authentication is not implemented yet. Coming soon!");
  }

  return (
    <section className="panel login">
      <h1>Log in</h1>
      <p className="placeholder">Placeholder for future authentication.</p>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <button type="submit" className="primary">Log in</button>
        {message && <p className="info" role="status">{message}</p>}
      </form>
    </section>
  );
}
