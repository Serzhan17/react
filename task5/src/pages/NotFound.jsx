import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

export default function NotFound() {
  useDocumentTitle("Page not found");
  return (
    <section className="panel center">
      <h1 className="big">404</h1>
      <p>This page does not exist.</p>
      <Link to="/" className="btn primary">Go to Home</Link>
    </section>
  );
}
