import { Link } from "react-router-dom";
import hero from "../assets/hero.svg";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

export default function Home() {
  useDocumentTitle("Home");
  return (
    <section className="hero">
      <div className="hero-text">
        <h1>Plan, track and finish your tasks</h1>
        <p>
          Task Tracker is a small React app with a fake asynchronous API. Browse tasks, search and filter them,
          open the details and follow your progress on the dashboard.
        </p>
        <div className="actions">
          <Link to="/tasks" className="btn primary">Browse tasks</Link>
          <Link to="/dashboard" className="btn">Open dashboard</Link>
          <Link to="/about" className="btn">About</Link>
        </div>
      </div>
      <img className="hero-img" src={hero} alt="Illustration of a task board with three columns" />
    </section>
  );
}
