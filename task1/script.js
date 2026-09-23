/* ============================================================
   Dispatch — async task board
   Demonstrates: closures, the call stack, Promises, async/await,
   the event loop, and the task/microtask queues.
   ============================================================ */

/* ----------------------------------------------------------
   1) createTask — a closure factory.
   Each call to createTask() opens a brand-new function scope.
   `count`, `status` and `lastDuration` live inside that scope
   and are never exposed directly — the only way to touch them
   is through the methods returned in the object below, which
   is exactly what makes the counter "private". Two different
   tasks never share these variables, because each call to
   createTask() creates its own scope with its own copies.
   ---------------------------------------------------------- */
function createTask(name, { failRate = 0.25, minMs = 500, maxMs = 2000 } = {}) {
  let count = 0;
  let status = 'idle';       // idle | running | completed | failed
  let lastDuration = null;
  let onChange = null;       // optional UI callback, set via onUpdate()

  function notify() {
    if (onChange) onChange();
  }

  async function run() {
    status = 'running';
    notify();

    const duration = Math.round(minMs + Math.random() * (maxMs - minMs));

    try {
      // The Promise + setTimeout pair simulates a network call:
      // work happens off the call stack, and the promise settles
      // once the timer fires.
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() < failRate) {
            reject(new Error(`${name} failed`));
          } else {
            resolve();
          }
        }, duration);
      });
      status = 'completed';
    } catch (err) {
      status = 'failed';
    }

    count += 1;
    lastDuration = duration;
    notify();
    return status;
  }

  function reset() {
    count = 0;
    status = 'idle';
    lastDuration = null;
    notify();
  }

  return {
    name,
    run,
    reset,
    getCount: () => count,
    getStatus: () => status,
    getLastDuration: () => lastDuration,
    onUpdate: (fn) => { onChange = fn; },
  };
}

/* ---------------------------------------------------------- */

const tasks = [
  createTask('Load Users'),
  createTask('Load Posts'),
  createTask('Load Comments'),
];

const taskGrid = document.getElementById('taskGrid');
const runAllBtn = document.getElementById('runAllBtn');
const compareBtn = document.getElementById('compareBtn');
const logEl = document.getElementById('log');
const clearLogBtn = document.getElementById('clearLogBtn');

function log(message, kind = '') {
  const line = document.createElement('div');
  line.className = `console-line ${kind ? `console-line--${kind}` : ''}`;
  const time = document.createElement('span');
  time.className = 'console-line__time';
  time.textContent = new Date().toLocaleTimeString([], { hour12: false }) + '.' +
    String(new Date().getMilliseconds()).padStart(3, '0');
  const text = document.createElement('span');
  text.textContent = message;
  line.append(time, text);
  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
}

clearLogBtn.addEventListener('click', () => { logEl.innerHTML = ''; });

/* ---------- rendering task cards ---------- */

function renderTasks() {
  taskGrid.innerHTML = '';
  tasks.forEach((task) => {
    const card = document.createElement('div');
    card.className = 'task-card';

    const status = task.getStatus();
    const count = task.getCount();
    const dur = task.getLastDuration();

    card.innerHTML = `
      <div class="task-card__top">
        <span class="dot dot--${status}"></span>
        <span class="task-card__name">${task.name}</span>
      </div>
      <div class="task-card__status">${status}</div>
      <div class="task-card__stats">
        <span>runs: <strong>${count}</strong></span>
        <span>last: <strong>${dur ? dur + ' ms' : '—'}</strong></span>
      </div>
      <div class="task-card__actions">
        <button class="btn btn--small" data-action="run">Run</button>
        <button class="btn btn--small btn--ghost" data-action="reset">Reset</button>
      </div>
    `;

    card.querySelector('[data-action="run"]').addEventListener('click', async () => {
      const result = await task.run();
      log(`${task.name} ${result === 'completed' ? 'Completed' : 'Failed'}`, result);
    });

    card.querySelector('[data-action="reset"]').addEventListener('click', () => {
      task.reset();
    });

    task.onUpdate(renderTasks);
    taskGrid.appendChild(card);
  });
}

tasks.forEach((t) => t.onUpdate(renderTasks));
renderTasks();

/* ---------- Run All Tasks ---------- */

runAllBtn.addEventListener('click', async () => {
  runAllBtn.disabled = true;
  log('Running all tasks concurrently…', 'info');

  // Promise.allSettled waits for every task to either resolve or
  // reject, without short-circuiting the way Promise.all would on
  // the first rejection — which matters here because some tasks
  // are expected to fail.
  const results = await Promise.allSettled(tasks.map((t) => t.run()));

  results.forEach((r, i) => {
    const outcome = r.status === 'fulfilled' ? r.value : 'failed';
    log(`${tasks[i].name} ${outcome === 'completed' ? 'Completed' : 'Failed'}`, outcome);
  });

  log('All tasks finished', 'info');
  runAllBtn.disabled = false;
});

/* ---------- Sequential vs concurrent comparison ---------- */

compareBtn.addEventListener('click', async () => {
  compareBtn.disabled = true;

  // Use fresh, isolated tasks so this comparison never disturbs
  // the counters / status shown on the board above.
  const seqTasks = [createTask('Users'), createTask('Posts'), createTask('Comments')];
  const conTasks = [createTask('Users'), createTask('Posts'), createTask('Comments')];

  log('Sequential run: awaiting each task one after another…', 'info');
  const seqStart = performance.now();
  await seqTasks[0].run();
  await seqTasks[1].run();
  await seqTasks[2].run();
  const seqTime = Math.round(performance.now() - seqStart);
  log(`Sequential total: ${seqTime} ms`, 'info');

  log('Concurrent run: starting all three at once with Promise.all…', 'info');
  const conStart = performance.now();
  await Promise.all(conTasks.map((t) => t.run()));
  const conTime = Math.round(performance.now() - conStart);
  log(`Concurrent total: ${conTime} ms`, 'info');

  log(
    `Concurrent was ~${Math.max(seqTime - conTime, 0)} ms faster: sequential ` +
    `time is roughly the SUM of each task's delay, because each await ` +
    `blocks the next line until it settles. Concurrent time is roughly ` +
    `the MAX of the three delays, because all three timers start together ` +
    `and run in parallel while the event loop waits on all of them at once.`,
    'info'
  );

  compareBtn.disabled = false;
});

/* ---------- Event Loop Demo ---------- */

const predictedList = document.getElementById('predictedList');
const actualList = document.getElementById('actualList');
const runLoopBtn = document.getElementById('runLoopBtn');

// Predicted order, written out BEFORE running anything — this is
// the "predict, then verify" step the assignment asks for.
const predicted = [
  { text: '1. sync: start',                 phase: 'sync' },
  { text: '2. sync: async fn start',        phase: 'sync' },
  { text: '3. sync: end',                   phase: 'sync' },
  { text: '4. microtask: promise A',        phase: 'microtask' },
  { text: '5. microtask: async fn resumed', phase: 'microtask' },
  { text: '6. microtask: promise B',        phase: 'microtask' },
  { text: '7. macrotask: timeout A (0ms)',  phase: 'macrotask' },
  { text: '8. macrotask: timeout B (0ms)',  phase: 'macrotask' },
];

function renderPredicted() {
  predictedList.innerHTML = '';
  predicted.forEach((p) => {
    const li = document.createElement('li');
    li.className = `phase--${p.phase}`;
    li.textContent = p.text;
    predictedList.appendChild(li);
  });
}
renderPredicted();

function addActual(text, phase) {
  const placeholder = actualList.querySelector('.placeholder');
  if (placeholder) placeholder.remove();
  const li = document.createElement('li');
  li.className = `phase--${phase}`;
  li.textContent = text;
  actualList.appendChild(li);
}

runLoopBtn.addEventListener('click', () => {
  actualList.innerHTML = '';
  log('--- Event Loop Demo ---', 'info');

  // The actual example referenced by the README:
  //   console.log(), two setTimeout()s, two Promise.resolve().then()s,
  //   and one async function using await.
  console.log('1: sync start');
  addActual('1: sync start', 'sync');
  log('1: sync start', 'info');

  setTimeout(() => {
    console.log('7: timeout A');
    addActual('7: timeout A (macrotask)', 'macrotask');
    log('7: timeout A', 'info');
  }, 0);

  Promise.resolve().then(() => {
    console.log('4: promise A');
    addActual('4: promise A (microtask)', 'microtask');
    log('4: promise A', 'info');
  });

  async function asyncFn() {
    console.log('2: async fn start');
    addActual('2: async fn start', 'sync');
    log('2: async fn start', 'info');

    await null; // suspends here; the rest becomes a microtask

    console.log('5: async fn resumed');
    addActual('5: async fn resumed (microtask)', 'microtask');
    log('5: async fn resumed', 'info');
  }
  asyncFn();

  setTimeout(() => {
    console.log('8: timeout B');
    addActual('8: timeout B (macrotask)', 'macrotask');
    log('8: timeout B', 'info');
  }, 0);

  Promise.resolve().then(() => {
    console.log('6: promise B');
    addActual('6: promise B (microtask)', 'microtask');
    log('6: promise B', 'info');
  });

  console.log('3: sync end');
  addActual('3: sync end', 'sync');
  log('3: sync end', 'info');

  // Explanation, logged after the synchronous part so it doesn't
  // interleave with the demo's own output:
  setTimeout(() => {
    log(
      'Order: the call stack always finishes running the current ' +
      'synchronous code first (1,2,3). Once the stack is empty, ALL ' +
      'queued microtasks run before the next macrotask (4,5,6) — ' +
      'note 5 runs before 6 because it was queued first, during step 2. ' +
      'Only after the microtask queue is fully drained does the event ' +
      'loop move on to the task (macrotask) queue for the timers (7,8).',
      'info'
    );
  }, 50);
});
