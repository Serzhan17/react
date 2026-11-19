import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

export default function About() {
  useDocumentTitle("About");
  return (
    <section className="panel prose">
      <h1>About the project</h1>
      <p>
        This is a student project for the React course. It started as an async effects exercise
        (loading, errors, race conditions) and was extended with routing and a clean application architecture.
      </p>
      <h2>What is inside</h2>
      <ul>
        <li>React 18 with React Router (nested routes, dynamic URLs, <code>useSearchParams</code>)</li>
        <li>A fake REST-like API with delays, random errors, search, filters, sorting and pagination</li>
        <li>Lazy-loaded pages with <code>React.lazy</code> and <code>Suspense</code></li>
        <li>A dashboard with statistics calculated from API data</li>
      </ul>
      <p><Link to="/tasks">Go to tasks →</Link></p>
    </section>
  );
}
