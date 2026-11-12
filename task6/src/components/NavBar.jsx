import { useState, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import { setSlowMode } from "../services/service.js";
import { useAuth } from "../context/AuthContext.jsx";

const LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/tasks", label: "Tasks" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/about", label: "About" },
];

const linkClass = ({ isActive }) => (isActive ? "active" : "");

export default function NavBar() {
  const [slow, setSlow] = useState(false);
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    setSlowMode(slow);
  }, [slow]);

  return (
    <header className="navbar">
      <Link to="/" className="brand">✔ Task Tracker</Link>
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
      {!loading && user && (
        <div className="user-box">
          <span className="user-email" title={user.email}>{user.email}</span>
          <button onClick={logout}>Logout</button>
        </div>
      )}
      <label className="switch">
        <input type="checkbox" checked={slow} onChange={(e) => setSlow(e.target.checked)} />
        Slow network (demo)
      </label>
    </header>
  );
}
