# Task Tracker — Installable PWA (Homework 7)

React + React Router + Firebase Auth, now an **installable, offline-capable PWA** with a hand-written Service Worker.
All previous features are kept: routes, search / filters / sorting / pagination in the URL, dashboard, create / edit / remove,
"Mark complete", Firebase Email/Password + Google login, protected `/profile`, in-memory query cache with invalidation.

## Run / test the PWA
```bash
npm install
cp .env.example .env.local   # fill in Firebase keys (Windows: copy .env.example .env.local)
npm run dev                  # development: the Service Worker is NOT registered here
npm run build && npm run preview   # production build: Service Worker + install + offline work here
```
Test in Chrome DevTools → **Application**: *Manifest* (installability), *Service Workers* (lifecycle, "Update on reload", "Offline" checkbox), *Cache Storage* (what is cached). **Lighthouse → Progressive Web App** audits the deployed URL.

## 1. Manifest & installation
- `public/manifest.json`: `name`, `short_name`, `start_url: "/"`, `scope: "/"`, `display: "standalone"`, `theme_color`, `background_color`, icons 192×192 and 512×512 (+ a maskable 512 icon), two shortcuts.
- Linked in `index.html` (`<link rel="manifest">`, `theme-color`, `apple-touch-icon`).
- An **Install app** button appears in the menu when the browser fires `beforeinstallprompt`.

## 2. Service Worker lifecycle (`sw-src/sw.template.js` → `dist/sw.js`)
The worker is written by hand. At build time `sw-src/generate-sw.js` (run from `vite.config.js`) lists every file of `dist/` (HTML, hashed JS/CSS chunks, icons, `offline.html`, manifest) and injects it into the template together with a **content hash used as the version**.
- **install** – pre-caches that list into `tt-precache-<version>`. It does *not* call `skipWaiting()`.
- **activate** – deletes every `tt-*` cache that is not one of the current three (old precaches are removed automatically), then `clients.claim()`.
- **fetch** – routing (see below).
- **Update mechanism** – the page (`src/services/pwa.js`) registers `/sw.js`, re-checks for updates on tab focus and hourly. When a new worker finishes installing while an old one controls the page, an **"A new version is available — Update"** toast appears. *Update* posts `SKIP_WAITING` to the waiting worker; on `controllerchange` the page reloads with the new version. No manual clearing of browser storage is needed. `sw.js` is served with `Cache-Control: no-cache` (`vercel.json`).

## 3. Caching strategies
| What | Strategy | Cache | Limit |
|---|---|---|---|
| App shell, built JS/CSS, icons, `offline.html`, manifest | **Pre-cache** (cache-first from the versioned precache) | `tt-precache-<hash>` | replaced on every new version |
| Images, fonts, icons not in the precache | **Cache-first** | `tt-static-v1` | max 60 entries |
| Public API: `/api/tasks.json` (list) and `/api/tasks/:id.json` (details) | **Network-first** (4 s timeout, then cache) | `tt-api-v1` | max 50 entries (oldest removed) |
| Page navigations | App shell from the precache (React Router renders the route), `offline.html` as last resort | precache | – |

- Only successful (`200`) **JSON** responses of the public API are stored.
- **Not cached:** non-GET requests, cross-origin requests (Firebase Auth, Google sign-in, token endpoints), requests with an `Authorization` header. Auth data never goes into a shared cache. User changes live in `localStorage` (only through `services/service.js`).
- **Cached data is visible to the user:** when the Service Worker answers from its cache it adds `X-Served-From: service-worker-cache`; the UI then shows **"You are viewing saved (cached) data"** with a Refresh button (list, details, dashboard). When the connection returns, such views refresh automatically.
- Failed requests never crash the app: they end in an error state with *Try again*, or in the `/offline` page.

## 4. Offline page & connectivity
- `/offline` (React page) and `public/offline.html` (static fallback) are both pre-cached, so they open **without internet**. The page has a message, styling and a **Retry connection** button.
- **Retry connection** does a real request (`/ping.txt?__ping=…`, the Service Worker never caches it) instead of trusting `navigator.onLine`.
- When a page needs data that was never fetched and the network is down, `QueryError` redirects to `/offline`; as soon as the connection is back (event + periodic real probe) the user is returned to the page they wanted.
- **Indicator:** the "Online / Offline" pill in the navbar plus an "You are offline" banner.
- Previously visited pages and cached public data keep working offline (open a task and the list while online, then switch the network off).

## 5. Mobile
- Works from **320 px** width; responsive hamburger menu (≤ 860 px), cards, forms, filters, dashboard and details switch to one-column layouts; no horizontal scrolling.
- Touch targets are ≥ 44 px, form controls use 16 px text (no iOS zoom), safe-area insets are respected, landscape orientation has its own compact rules.

## Public API
Read requests are real HTTP requests to static JSON files served by the same host (`public/api/tasks.json`, `public/api/tasks/<id>.json`). Create / edit / remove are stored as local changes (`localStorage`, only in `services/service.js`) and layered over the server data, so they also work offline.

## How to demo offline
1. Open the deployed app online, visit `/tasks`, a task and `/dashboard`.
2. DevTools → Network → **Offline** (or airplane mode). Reload: the app opens, data shows the *cached data* notice, indicator says *Offline*.
3. Open a task you never visited → redirect to `/offline` → switch the network back on → you return automatically (or press *Retry connection*).
4. Deploy a new version, reopen the app: the **Update** toast appears; press *Update*.

---

# Notes from the previous homeworks (still valid)

React + React Router + Firebase Authentication + a small server-state cache.
Built on top of the Task 5 project: all routes, search/filters/sorting/pagination (in the URL), dashboard,
create / edit / remove, "Mark complete" and the slow-network demo switch still work.

## Run locally
```bash
npm install
cp .env.example .env.local     # Windows: copy .env.example .env.local
# fill in the VITE_FIREBASE_* values (see below)
npm run dev
npm run build
```

## Firebase setup
1. [Firebase Console](https://console.firebase.google.com) → **Add project**.
2. **Build → Authentication → Get started → Sign-in method**: enable **Email/Password** and **Google**.
3. **Project settings → General → Your apps → Web (`</>`)**: register an app and copy the config values into `.env.local`:
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```
4. **Authentication → Settings → Authorized domains**: add your deployed domain (e.g. `your-app.vercel.app`). Without this Google sign-in fails with `auth/unauthorized-domain`.
5. On Vercel/Netlify add the same `VITE_FIREBASE_*` variables in the project settings (Environment Variables) and redeploy — Vite reads them at build time.

`.env.local` is in `.gitignore`; `.env.example` documents the required variables.

## Routes
| Route | Page | Access |
|---|---|---|
| `/` | Home | public |
| `/about` | About | public |
| `/tasks`, `/tasks/:id`, `/tasks/new`, `/tasks/:id/edit` | Tasks | public |
| `/dashboard` | Dashboard | public |
| `/login` | Email/password + Google login | public (logged-in users are redirected) |
| `/signup` | Sign up with validation | public (logged-in users are redirected) |
| `/profile` | Email, UID, logout | **protected** → redirects to `/login` |
| `*` | 404 | public |

After login the user returns to the page they originally wanted (`location.state.from`).

## Architecture
```
src/
  firebase.js              Firebase init from import.meta.env (VITE_*)
  context/AuthContext.jsx  AuthProvider + useAuth (onAuthStateChanged, loading, error)
  services/
    authService.js         all Firebase Auth calls + error messages
    service.js             fake REST API + localStorage (invalidates the cache after writes)
    cache.js               server-state cache
    queryKeys.js           query keys
  hooks/
    useQuery.js            cached, race-safe fetching hook
    useTasks.js            useTasks / useTask / useAllTasks
  components/ProtectedRoute.jsx
  pages/ ...               UI only: no localStorage, no direct API/Firebase calls
```
UI components use hooks (`useAuth`, `useTasks`, …) and service functions; `localStorage` is touched only in `services/service.js`.

## Caching strategy
Custom cache in `services/cache.js`, used through the `useQuery` hook.

**Query keys** (hierarchical arrays):
- `["tasks", "list", { q, status, priority, assignee, sort, order, page, limit }]` — each filter/page combination is its own entry
- `["tasks", "detail", "<id>"]` — one entry per task
- `["tasks", "all"]` — full dataset for the dashboard

**Freshness / revalidation:** every entry is *fresh* for 30 seconds (`staleTime`).
- Fresh entry → shown instantly, **no request** (e.g. going back to a page you already viewed).
- Stale entry → old data is shown immediately and a request revalidates it in the background (stale-while-revalidate).
- No entry → loading state and a request.
- Identical requests that run at the same time share one promise (deduplication).
- The **Reload** buttons throw the entry away and force a fresh request.

**Invalidation:** after every successful write in `service.js` (`createTask`, `updateTask`, `deleteTask`, reset demo data) the whole `["tasks"]` group is invalidated, so lists, filters, pagination and the dashboard are refetched next time they are shown. After create/update the fresh details of that task are put into the cache directly (`["tasks","detail",id]`), so opening it needs no extra request.

**Outdated responses:**
1. `useQuery`'s effect cleanup sets `cancelled = true`, so a late response of a previous key (another task, another filter) is ignored by the component.
2. The cache has an `epoch` counter bumped on every invalidation: a response requested *before* an invalidation is never written into the cache afterwards.
3. While the key changes, the hook derives data only for the *current* key, so a previous task is never shown under a new URL.

Loading, error (with Retry) and empty states are handled in every page.

## Authentication
- `AuthProvider` subscribes to `onAuthStateChanged` once; `loading` stays `true` until Firebase restores the session, so protected pages never flash the login redirect on refresh.
- Persistence: `browserLocalPersistence` — the session survives refresh and browser restart.
- Signup validates the email format, password length (≥ 6) and password confirmation. Firebase errors are translated into readable messages.
- NavBar shows **Login / Signup** for guests and **Profile / Logout** (+ email) for authenticated users.

## Demo checklist
1. Sign up with email/password → redirected to `/profile` (email + UID). Refresh → still logged in.
2. Log out → NavBar switches back; open `/profile` directly → redirected to `/login`, and after login you return to `/profile`.
3. Log in with Google.
4. Open `/tasks`, go to a task and back: the list appears instantly (cache). Mark a task complete / edit / remove → list and dashboard show updated data (cache invalidated).
5. Switch on "Slow network (demo)" and quickly click between tasks: the details of an old task never overwrite the new one.
