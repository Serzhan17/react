// Fake async backend. ALL API logic and localStorage access live in this file.
// Every call returns a Promise with a random delay and a random chance of failure.
// Supports search, filtering, sorting, pagination and fetching an item by ID.

import { invalidate, setCache } from "./cache.js";
import { taskKeys } from "./queryKeys.js";

const KEY = "task-tracker-db-v2";
const FAIL_RATE = 0.1;
const PRIORITY_RANK = { low: 1, medium: 2, high: 3 };
const SORT_FIELDS = ["title", "dueDate", "priority", "createdAt", "estimateHours"];

let slowMode = false; // demo switch: much longer delays
export function setSlowMode(value) {
  slowMode = value;
}

export class ApiError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

function t(id, title, description, status, priority, assignee, dueDate, estimateHours, tags, createdAt) {
  return { id, title, description, status, priority, assignee, dueDate, estimateHours, tags, createdAt };
}

const SEED = [
  t(1, "Set up the project", "Create the Vite + React project and configure the repository.", "done", "high", "Serzhan", "2026-10-20", 2, ["setup", "react"], "2026-10-10T09:00:00.000Z"),
  t(2, "Write the fake API", "Promises, random delays, random errors and localStorage persistence.", "done", "high", "Serzhan", "2026-10-25", 4, ["api", "promises"], "2026-10-11T10:30:00.000Z"),
  t(3, "Handle race conditions", "Switching quickly between items must never show outdated details.", "in_progress", "medium", "Nurasyl", "2026-11-08", 3, ["useEffect", "cleanup"], "2026-10-12T12:00:00.000Z"),
  t(4, "Deploy the app", "Publish the build on Vercel and attach the link.", "todo", "low", "Serzhan", "2026-11-12", 1, ["deploy"], "2026-10-13T15:45:00.000Z"),
  t(5, "Add React Router", "Nested routes, dynamic URLs and a shared layout with Outlet.", "in_progress", "high", "Serzhan", "2026-11-10", 5, ["router", "react"], "2026-10-28T08:20:00.000Z"),
  t(6, "Design the dashboard", "Statistics, breakdowns and an interactive filter.", "todo", "medium", "Nurasyl", "2026-11-15", 4, ["dashboard", "ui"], "2026-10-29T11:10:00.000Z"),
  t(7, "Write the login page", "Styled placeholder for future authentication.", "todo", "low", "Aigerim", "2026-11-18", 2, ["login", "ui"], "2026-10-30T14:00:00.000Z"),
  t(8, "Add search and filters", "Sync search, filters and sorting with URL parameters.", "in_progress", "high", "Aigerim", "2026-11-09", 3, ["search", "router"], "2026-10-31T09:40:00.000Z"),
  t(9, "Implement pagination", "Paginate the list and keep the page number in the URL.", "todo", "medium", "Serzhan", "2026-11-20", 2, ["pagination", "router"], "2026-11-01T10:00:00.000Z"),
  t(10, "Lazy-load the pages", "Use React.lazy and Suspense for 3+ pages.", "todo", "medium", "Nurasyl", "2026-11-22", 2, ["lazy", "performance"], "2026-11-01T13:30:00.000Z"),
  t(11, "Create a 404 page", "Custom Not Found page with a link back home.", "done", "low", "Aigerim", "2026-11-02", 1, ["404", "ui"], "2026-11-02T08:00:00.000Z"),
  t(12, "Write the README", "Document routes, architecture and defense notes.", "todo", "low", "Serzhan", "2026-11-25", 1, ["docs"], "2026-11-02T16:15:00.000Z"),
  t(13, "Test direct URLs", "Refresh and Back/Forward must keep working on every page.", "todo", "high", "Nurasyl", "2026-11-07", 2, ["testing", "router"], "2026-11-03T09:05:00.000Z"),
  t(14, "Prepare the defense", "Explain effects, cleanup, race conditions and routing.", "todo", "high", "Serzhan", "2026-12-05", 3, ["defense"], "2026-11-03T18:00:00.000Z"),
];

function readDb() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* corrupted data: fall through to the seed */
  }
  localStorage.setItem(KEY, JSON.stringify(SEED));
  return SEED;
}

function writeDb(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

// Runs `work` after a random delay; rejects randomly to simulate network errors.
function simulate(work, { canFail = true } = {}) {
  const delay = slowMode ? 2000 + Math.random() * 2500 : 400 + Math.random() * 1000;
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (canFail && Math.random() < FAIL_RATE) {
        reject(new ApiError("Network error: the server did not respond. Please try again.", 503));
        return;
      }
      try {
        resolve(work());
      } catch (err) {
        reject(err);
      }
    }, delay);
  });
}

// Details contain extra computed fields that the list does not need.
function toDetails(task) {
  const today = new Date(new Date().toISOString().slice(0, 10));
  const ageDays = Math.max(0, Math.floor((Date.now() - new Date(task.createdAt).getTime()) / 86400000));
  const daysUntilDue = task.dueDate ? Math.round((new Date(task.dueDate) - today) / 86400000) : null;
  const isOverdue = task.status !== "done" && daysUntilDue !== null && daysUntilDue < 0;
  return { ...task, ageDays, daysUntilDue, isOverdue };
}

// GET /tasks?q=&status=&priority=&assignee=&sort=&order=&page=&limit=
export function getTasks({
  q = "",
  status = "",
  priority = "",
  assignee = "",
  sort = "createdAt",
  order = "desc",
  page = 1,
  limit = 6,
} = {}) {
  return simulate(() => {
    const all = readDb();
    const needle = q.trim().toLowerCase();
    const result = all.filter(
      (task) =>
        (!status || task.status === status) &&
        (!priority || task.priority === priority) &&
        (!assignee || task.assignee === assignee) &&
        (!needle || [task.title, task.description, ...task.tags].some((s) => s.toLowerCase().includes(needle)))
    );

    const field = SORT_FIELDS.includes(sort) ? sort : "createdAt";
    const dir = order === "asc" ? 1 : -1;
    result.sort((a, b) => {
      let x = a[field];
      let y = b[field];
      if (field === "priority") {
        x = PRIORITY_RANK[x];
        y = PRIORITY_RANK[y];
      }
      if (typeof x === "string") return x.localeCompare(y) * dir;
      return (x - y) * dir;
    });

    const total = result.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const current = Math.min(Math.max(1, Number(page) || 1), totalPages);
    return {
      items: result.slice((current - 1) * limit, current * limit),
      total,
      page: current,
      totalPages,
      limit,
      assignees: [...new Set(all.map((task) => task.assignee))].sort(),
    };
  });
}

// GET /tasks/:id
export function getTask(id) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return Promise.reject(new ApiError("Task not found.", 404));
  }
  return simulate(() => {
    const task = readDb().find((i) => i.id === numericId);
    if (!task) throw new ApiError("Task not found.", 404);
    return toDetails(task);
  });
}

export function createTask(data) {
  return simulate(() => {
    const items = readDb();
    const nextId = items.reduce((max, i) => Math.max(max, i.id), 0) + 1;
    const task = { ...data, id: nextId, createdAt: new Date().toISOString() };
    writeDb([...items, task]);
    return toDetails(task);
  }).then((task) => {
    invalidate(taskKeys.all); // lists and dashboard are outdated now
    setCache(taskKeys.detail(task.id), task);
    return task;
  });
}

export function updateTask(id, patch) {
  return simulate(() => {
    const items = readDb();
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) throw new ApiError("Task not found.", 404);
    const updated = { ...items[index], ...patch, id };
    const next = [...items];
    next[index] = updated;
    writeDb(next);
    return toDetails(updated);
  }).then((task) => {
    invalidate(taskKeys.all); // the item changed: every list and the dashboard must be refetched
    setCache(taskKeys.detail(task.id), task); // but we already know the fresh details
    return task;
  });
}

export function deleteTask(id) {
  return simulate(() => {
    const items = readDb();
    if (!items.some((i) => i.id === id)) throw new ApiError("Task not found.", 404);
    writeDb(items.filter((i) => i.id !== id));
    return { id };
  }).then((result) => {
    invalidate(taskKeys.all);
    return result;
  });
}

export function resetDemoData() {
  return simulate(
    () => {
      writeDb(SEED);
      return true;
    },
    { canFail: false }
  ).then((result) => {
    invalidate(taskKeys.all);
    return result;
  });
}
