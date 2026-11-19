import { useState, useEffect } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { setSlowMode } from "../services/service.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useInstallPrompt } from "../hooks/useInstallPrompt.js";
import ConnectionStatus from "./ConnectionStatus.jsx";

const LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/tasks", label: "Tasks" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/about", label: "About" },
];

const linkClass = ({ isActive }) => (isActive ? "active" : "");

export default function NavBar() {
  const [slow, setSlow] = useState(false);
  const [open, setOpen] = useState(false); // mobile menu
  const { user, loading, logout } = useAuth();
  const { canInstall, install } = useInstallPrompt();
  const location = useLocation();

  useEffect(() => {
    setSlowMode(slow);
  }, [slow]);

  // close the mobile menu after navigation
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header className="navbar">
      <div className="navbar-top">
        <Link to="/" className="brand">✔ Task Tracker</Link>
        <ConnectionStatus />
        <button
          className="menu-toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="main-menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      <div id="main-menu" className={"nav-menu" + (open ? " open" : "")}>
        <nav className="nav-links">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
          {!loading && !user && (
            <>
              <NavLink to="/login" className={linkClass}>Login</NavLink>
              <NavLink to="/signup" className={linkClass}>Signup</NavLink>
            </>
          )}
          {!loading && user && <NavLink to="/profile" className={linkClass}>Profile</NavLink>}
        </nav>

        <div className="nav-extra">
          {!loading && user && (
            <div className="user-box">
              <span className="user-email" title={user.email}>{user.email}</span>
              <button onClick={logout}>Logout</button>
            </div>
          )}
          {canInstall && <button onClick={install}>⬇ Install app</button>}
          <label className="switch">
            <input type="checkbox" checked={slow} onChange={(e) => setSlow(e.target.checked)} />
            Slow network (demo)
          </label>
        </div>
      </div>
    </header>
  );
}
