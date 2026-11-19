import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import NavBar from "../components/NavBar.jsx";
import OfflineBanner from "../components/OfflineBanner.jsx";
import UpdatePrompt from "../components/UpdatePrompt.jsx";

export default function RootLayout() {
  return (
    <div className="app">
      <NavBar />
      <OfflineBanner />
      <main className="page">
        <Suspense fallback={<p className="placeholder" aria-busy="true">Loading page…</p>}>
          <Outlet />
        </Suspense>
      </main>
      <footer className="footer">Task Tracker · installable PWA</footer>
      <UpdatePrompt />
    </div>
  );
}
