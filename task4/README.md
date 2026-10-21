# Task Tracker — Async React (Task 4)

React + Vite app with a fake async API (Promises, random delays, random errors, `localStorage`).

## Run
```bash
npm install
npm run dev      # development
npm run build    # production build → dist/
```

## Structure
- `src/api.js` — fake backend, the only file that touches `localStorage`
- `src/App.jsx` — state + effects (only `useState` / `useEffect`)
- `src/components/` — `ItemList`, `ItemDetails`, `ItemForm`

## Defense notes
- **Race conditions:** the details effect has a `cancelled` flag set in the cleanup; a late response of a previous item is ignored.
- **Stale closures:** `handleComplete` captures `const id = selectedId` before `await`, uses functional `setState`, and only touches the details panel if it still shows the same item. `pending` blocks conflicting actions.
- **Demo:** turn on "Slow network (demo)", click task A, then quickly task B — A's response never overwrites B.
