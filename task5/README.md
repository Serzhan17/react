# Task Tracker — Routing & Application Architecture (Homework 5)

React + React Router + fake async API (Promises, delays, random errors, `localStorage`).
This is the Task 4 project extended with routing. All Task 4 features are preserved
(create / edit / remove, "Mark complete", reload, race-condition and stale-closure protection, slow-network demo switch).

## Run
```bash
npm install
npm run dev
npm run build
```

## Routes
| Route | Page |
|---|---|
| `/` | Home |
| `/about` | About |
| `/tasks` | Tasks list (search, filters, sort, pagination in URL) |
| `/tasks/:id` | Task details |
| `/tasks/new`, `/tasks/:id/edit` | Create / edit form |
| `/dashboard` | Dashboard |
| `/login` | Login (placeholder) |
| `*` | 404 |

## Structure
```
src/
  App.jsx            routing only (lazy pages)
  layouts/           RootLayout (NavBar + Suspense + Outlet)
  pages/             Home, About, Login, TaskList, TaskDetails, TaskFormPage, Dashboard, NotFound
  components/        NavBar, TaskCard, Pagination, StatCard, BarList, TaskForm, Badge
  hooks/             useAsync (race-safe fetching), useDocumentTitle
  services/service.js  fake API + localStorage
  styles/main.css
```

## Defense notes
- **useSearchParams:** the URL is the source of truth for `q`, `status`, `priority`, `assignee`, `sort`, `order`, `page` — links are shareable, Back/Forward and refresh work.
- **Lazy loading:** every page except Home is `React.lazy`; `<Suspense>` wraps `<Outlet />` in `RootLayout`.
- **Stale requests:** `useAsync` sets `cancelled = true` in the effect cleanup, so an old response never overwrites new data. Details are re-fetched when `:id` changes.
- **Invalid IDs:** `getTask` rejects with a 404 `ApiError` → "Task not found" screen with links back.
- **Stale closures:** `handleComplete` captures `task.id` before `await`, uses `setData(prev => …)` and `pending` blocks conflicting actions.

## Deploy
Vercel / Netlify: build `npm run build`, output `dist`. `vercel.json` and `public/_redirects` rewrite all URLs to `index.html`, so direct links and refresh work.
