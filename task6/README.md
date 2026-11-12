# Task Tracker — Server Data, Caching & Firebase Auth (Homework 6)

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
