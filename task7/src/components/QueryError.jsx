import { Navigate, useLocation } from "react-router-dom";

// Error state for data pages. If the failure is "offline and not cached", the navigation cannot be
// completed, so the user is sent to the dedicated /offline page (and returned here afterwards).
export default function QueryError({ error, onRetry }) {
  const location = useLocation();
  if (error && error.offline) {
    return <Navigate to="/offline" replace state={{ from: location }} />;
  }
  return (
    <div className="state">
      <p className="error" role="alert">{error.message}</p>
      <button onClick={onRetry}>Try again</button>
    </div>
  );
}
