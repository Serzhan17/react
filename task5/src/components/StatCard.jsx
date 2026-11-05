import { Link } from "react-router-dom";

export default function StatCard({ label, value, hint, to }) {
  const body = (
    <>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
      {hint && <span className="stat-hint">{hint}</span>}
    </>
  );
  return to ? (
    <Link to={to} className="stat">{body}</Link>
  ) : (
    <div className="stat">{body}</div>
  );
}
