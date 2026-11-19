import { Link } from "react-router-dom";

export default function BarList({ title, rows }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <section className="panel">
      <h2>{title}</h2>
      {rows.length === 0 && <p className="placeholder">No data.</p>}
      <ul className="bars">
        {rows.map((r) => (
          <li key={r.label}>
            <Link to={r.to}>
              <span className="bar-label">{r.label}</span>
              <span className="bar-track">
                <span className="bar-fill" style={{ width: (r.value / max) * 100 + "%" }} />
              </span>
              <span className="bar-value">{r.value}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
