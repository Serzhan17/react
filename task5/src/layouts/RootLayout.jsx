import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import NavBar from "../components/NavBar.jsx";

export default function RootLayout() {
  return (
    <div className="app">
      <NavBar />
      <main className="page">
        <Suspense fallback={<p className="placeholder" aria-busy="true">Loading page…</p>}>
          <Outlet />
        </Suspense>
      </main>
      <footer className="footer">Task Tracker · React Router demo</footer>
    </div>
  );
}
