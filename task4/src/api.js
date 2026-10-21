// Fake async backend. ALL localStorage access lives here — components never touch it.
// Every call returns a Promise with a random delay and a random chance of failure.

const KEY = "task-tracker-db-v1";
const FAIL_RATE = 0.15;

let slowMode = false; // for the defense demo: makes delays much longer
export function setSlowMode(value) {
  slowMode = value;
}

const SEED = [
  {
    id: 1,
    title: "Set up the project",
    description: "Create the Vite + React project and configure the repository.",
    status: "done",
    priority: "high",
    assignee: "Serzhan",
    dueDate: "2026-10-20",
    estimateHours: 2,
    tags: ["setup", "react"],
    createdAt: "2026-10-10T09:00:00.000Z",
  },
  {
    id: 2,
    title: "Write the fake API",
    description: "Promises, random delays, random errors and localStorage persistence.",
    status: "in_progress",
    priority: "high",
    assignee: "Serzhan",
    dueDate: "2026-10-25",
    estimateHours: 4,
    tags: ["api", "promises"],
    createdAt: "2026-10-11T10:30:00.000Z",
  },
  {
    id: 3,
    title: "Handle race conditions",
    description: "Switching quickly between items must never show outdated details.",
    status: "todo",
    priority: "medium",
    assignee: "Nurasyl",
    dueDate: "2026-10-28",
    estimateHours: 3,
    tags: ["useEffect", "cleanup"],
    createdAt: "2026-10-12T12:00:00.000Z",
  },
  {
    id: 4,
    title: "Deploy the app",
    description: "Publish the build on Vercel or Netlify and attach the link.",
    status: "todo",
    priority: "low",
    assignee: "Serzhan",
    dueDate: "2026-10-30",
    estimateHours: 1,
    tags: ["deploy"],
    createdAt: "2026-10-13T15:45:00.000Z",
  },
];

function readDb() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* corrupted data — fall through to the seed */
  }
  localStorage.setItem(KEY, JSON.stringify(SEED));
  return SEED;
}

function writeDb(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

// Runs `work` after a random delay; rejects randomly to simulate network errors.
function simulate(work, { canFail = true } = {}) {
  const delay = slowMode ? 2000 + Math.random() * 2500 : 400 + Math.random() * 1200;
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (canFail && Math.random() < FAIL_RATE) {
        reject(new Error("Network error: the server did not respond. Please try again."));
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

// The list is lightweight: only the fields needed to render a row.
function toSummary({ id, title, status, priority }) {
  return { id, title, status, priority };
}

// Details are heavier: loaded only when an item is selected.
function toDetails(item) {
  const created = new Date(item.createdAt);
  const ageDays = Math.max(0, Math.floor((Date.now() - created.getTime()) / 86400000));
  return { ...item, ageDays };
}

export function listItems() {
  return simulate(() => readDb().map(toSummary));
}

export function getItem(id) {
  return simulate(() => {
    const item = readDb().find((i) => i.id === id);
    if (!item) throw new Error("Task not found.");
    return toDetails(item);
  });
}

export function createItem(data) {
  return simulate(() => {
    const items = readDb();
    const nextId = items.reduce((max, i) => Math.max(max, i.id), 0) + 1;
    const item = { ...data, id: nextId, createdAt: new Date().toISOString() };
    writeDb([...items, item]);
    return toDetails(item);
  });
}

export function updateItem(id, patch) {
  return simulate(() => {
    const items = readDb();
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) throw new Error("Task not found.");
    const updated = { ...items[index], ...patch, id };
    const next = [...items];
    next[index] = updated;
    writeDb(next);
    return toDetails(updated);
  });
}

export function removeItem(id) {
  return simulate(() => {
    const items = readDb();
    if (!items.some((i) => i.id === id)) throw new Error("Task not found.");
    writeDb(items.filter((i) => i.id !== id));
    return { id };
  });
}

export function resetDemoData() {
  return simulate(
    () => {
      writeDb(SEED);
      return SEED.map(toSummary);
    },
    { canFail: false }
  );
}
