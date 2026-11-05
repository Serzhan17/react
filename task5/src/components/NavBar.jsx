import { useState, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import { setSlowMode } from "../services/service.js";

const LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/tasks", label: "Tasks" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/about", label: "About" },
  { to: "/login", label: "Login" },
];

export default function NavBar() {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    setSlowMode(slow);
  }, [slow]);

  return (
    <header className="navbar">
      <Link to="/" className="brand">✔ Task Tracker</Link>
      <nav className="nav-links">
        {LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? "active" : "")}>
            {l.label}
          </NavLink>
        ))}
      </nav>
      <label className="switch">
        <input type="checkbox" checked={slow} onChange={(e) => setSlow(e.target.checked)} />
        Slow network (demo)
      </label>
    </header>
  );
}
