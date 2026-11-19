// Task API.
//  - READ: real HTTP requests to the public JSON API (/api/tasks.json, /api/tasks/:id.json).
//    These are the requests the Service Worker caches (network-first) for offline use.
//  - WRITE: create / edit / remove are stored as local changes in localStorage and layered over the
//    server data (a "fake backend" for writes). ALL localStorage access lives in this file.
// Every call has a random delay and a small chance of a simulated server error.
import { invalidate, setCache } from "./cache.js";
import { taskKeys } from "./queryKeys.js";

const KEY = "task-tracker-changes-v1";
const API_BASE = "/api";
const FAIL_RATE = 0.1;
const FIRST_LOCAL_ID = 1000; // ids of locally created tasks never collide with server ids
const PRIORITY_RANK = { low: 1, medium: 2, high: 3 };
const SORT_FIELDS = ["title", "dueDate", "priority", "createdAt", "estimateHours"];

let slowMode = false; // demo switch: much longer delays
export function setSlowMode(value) {
  slowMode = value;
}

export class ApiError extends Error {
  constructor(message, status = 500, { offline = false } = {}) {
    super(message);
    this.status = status;
    this.offline = offline; // true = no network AND nothing cached for this request
  }
}

const offlineError = () =>
  new ApiError("You are offline and this data has not been saved on your device yet.", 0, { offline: true });

/* ---------- local changes (localStorage) ---------- */
function readChanges() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { overrides: parsed.overrides || {}, removed: parsed.removed || [] };
    }
  } catch {
    /* corrupted data: start clean */
  }
  return { overrides: {}, removed: [] };
}

function writeChanges(changes) {
  localStorage.setItem(KEY, JSON.stringify(changes));
}

/* ---------- HTTP ---------- */
async function fetchJson(path) {
  let response;
  try {
    response = await fetch(API_BASE + path);
  } catch {
    throw offlineError(); // network failed and the Service Worker had nothing either
  }
  if (response.status === 503 && response.headers.get("X-Offline")) throw offlineError();
  if (response.status === 404) throw new ApiError("Task not found.", 404);
  if (!response.ok) throw new ApiError(`Server error (${response.status}).`, response.status);
  if (!(response.headers.get("Content-Type") || "").includes("json")) {
    throw new ApiError("Task not found.", 404); // the SPA fallback returned HTML for a missing file
  }
  return {
    data: await response.json(),
    // The Service Worker marks answers it served from its cache.
    fromCache: response.headers.get("X-Served-From") === "service-worker-cache",
  };
}

// Runs `work` after a random delay; rejects randomly to simulate server errors.
function simulate(work, { canFail = true } = {}) {
  const delay = slowMode ? 2000 + Math.random() * 2500 : 300 + Math.random() * 900;
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      if (canFail && Math.random() < FAIL_RATE) {
        reject(new ApiError("Network error: the server did not respond. Please try again.", 503));
        return;
      }
      try {
        resolve(await work());
      } catch (err) {
        reject(err);
      }
    }, delay);
  });
}

/* ---------- helpers ---------- */
function mergeTasks(base, changes) {
  const removed = new Set(changes.removed);
  const merged = base.filter((t) => !removed.has(t.id)).map((t) => changes.overrides[t.id] || t);
  const baseIds = new Set(base.map((t) => t.id));
  Object.values(changes.overrides).forEach((t) => {
    if (!baseIds.has(t.id) && !removed.has(t.id)) merged.push(t);
  });
  return merged;
}

// Details contain extra computed fields that the list does not need.
function toDetails(task) {
  const today = new Date(new Date().toISOString().slice(0, 10));
  const ageDays = Math.max(0, Math.floor((Date.now() - new Date(task.createdAt).getTime()) / 86400000));
  const daysUntilDue = task.dueDate ? Math.round((new Date(task.dueDate) - today) / 86400000) : null;
  const isOverdue = task.status !== "done" && daysUntilDue !== null && daysUntilDue < 0;
  return { ...task, ageDays, daysUntilDue, isOverdue };
}

async function loadTask(id) {
  const changes = readChanges();
  if (changes.removed.includes(id)) throw new ApiError("Task not found.", 404);
  if (changes.overrides[id]) return { task: changes.overrides[id], fromCache: false };
  const { data, fromCache } = await fetchJson(`/tasks/${id}.json`);
  return { task: data, fromCache };
}

/* ---------- reads ---------- */
// GET list: search, filters, sorting and pagination are applied to the downloaded list.
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
  return simulate(async () => {
    const { data, fromCache } = await fetchJson("/tasks.json");
    const all = mergeTasks(data.items, readChanges());
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
      fromCache,
    };
  });
}

// GET /api/tasks/:id.json
export function getTask(id) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return Promise.reject(new ApiError("Task not found.", 404));
  }
  return simulate(async () => {
    const { task, fromCache } = await loadTask(numericId);
    return { ...toDetails(task), fromCache };
  });
}

/* ---------- writes (local changes) + cache invalidation ---------- */
export function createTask(data) {
  return simulate(() => {
    const changes = readChanges();
    const used = [
      ...Object.keys(changes.overrides).map(Number),
      ...changes.removed,
    ].filter((n) => n >= FIRST_LOCAL_ID);
    const id = Math.max(FIRST_LOCAL_ID - 1, ...used) + 1;
    const task = { ...data, id, createdAt: new Date().toISOString() };
    changes.overrides[id] = task;
    writeChanges(changes);
    return toDetails(task);
  }).then((task) => {
    invalidate(taskKeys.all); // lists and dashboard are outdated now
    setCache(taskKeys.detail(task.id), task);
    return task;
  });
}

export function updateTask(id, patch) {
  return simulate(async () => {
    const { task } = await loadTask(id);
    const updated = { ...task, ...patch, id };
    const changes = readChanges();
    changes.overrides[id] = updated;
    writeChanges(changes);
    return toDetails(updated);
  }).then((task) => {
    invalidate(taskKeys.all); // the item changed: every list and the dashboard must be refetched
    setCache(taskKeys.detail(task.id), task); // but the fresh details are already known
    return task;
  });
}

export function deleteTask(id) {
  return simulate(() => {
    const changes = readChanges();
    delete changes.overrides[id];
    if (!changes.removed.includes(id)) changes.removed.push(id);
    writeChanges(changes);
    return { id };
  }).then((result) => {
    invalidate(taskKeys.all);
    return result;
  });
}

export function resetDemoData() {
  return simulate(
    () => {
      localStorage.removeItem(KEY);
      return true;
    },
    { canFail: false }
  ).then((result) => {
    invalidate(taskKeys.all);
    return result;
  });
}
