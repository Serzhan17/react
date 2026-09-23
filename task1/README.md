# Dispatch — Async Task Board

A small vanilla JS/HTML/CSS project practicing closures, the call stack,
Promises, `async`/`await`, and the event loop.

Open `index.html` in a browser. Each task card has **Run** and **Reset**
buttons, plus a global **Run All Tasks** button. **Compare Sequential /
Concurrent** times both execution styles. **Run Event Loop Demo** runs a
fixed example and prints the real order next to a written prediction.

## How the closure keeps the counter private

`createTask(name)` (in `script.js`) declares `count`, `status`, and
`lastDuration` as local variables inside its own function body, then
returns an object of methods (`run`, `reset`, `getCount`, …) that close
over those variables. Nothing outside `createTask` ever gets a direct
reference to `count` — the only way to read or change it is through the
returned methods. Because every call to `createTask()` opens a fresh
function scope, `Load Users` and `Load Posts` each get their own
independent `count`, even though they're built from the same function.
That's the whole trick: privacy here isn't a language feature (JS has no
`private` keyword for plain functions) — it's just that the variable
lives in a scope nothing outside can reach.

## The call stack, in one example

When a task card's **Run** button is clicked, the handler calls
`task.run()`. That pushes `run()` onto the call stack. `run()` is
`async`, so its body executes synchronously up to the first `await`:
it sets `status = 'running'`, calls `notify()` (which re-renders the
card), and then hits `await new Promise(...)`. At that point `run()`
is suspended and popped off the stack — the `setTimeout` inside the
Promise executor has already scheduled its callback and handed control
back. The stack is empty again and the browser is free to repaint the
UI and handle other clicks while the timer counts down in the
background. When the timer fires, its callback is pushed onto the
stack, runs `resolve()`/`reject()`, and that in turn lets `run()`
resume from where it left off — the stack briefly holds `run()`'s
resumed continuation until it returns.

## How JS continues while `setTimeout` is waiting

`setTimeout` isn't part of the JS engine itself — it's a Web API
provided by the browser. Calling it just registers a callback and a
delay with the browser and returns immediately, so the call stack is
never blocked waiting for the timer. The browser's own timer thread
counts down independently; once it reaches zero, the callback is
placed in the **task (macrotask) queue**, and the **event loop** only
moves it onto the call stack once the stack is empty. That's why the
rest of the script — including other tasks starting, or button clicks
being handled — keeps running while a task's simulated network delay
is "in flight".

## Predicted vs. actual event loop output

Predicted order, written before running (see `predicted` array in
`script.js` and the left-hand panel in the UI):

```
1. sync: start
2. sync: async fn start
3. sync: end
4. microtask: promise A
5. microtask: async fn resumed
6. microtask: promise B
7. macrotask: timeout A (0ms)
8. macrotask: timeout B (0ms)
```

Actual output, printed by clicking **Run Event Loop Demo** (also mirrored
in the on-page log and the browser console via `console.log`):

```
1: sync start
2: async fn start
3: sync end
4: promise A
5: async fn resumed
6: promise B
7: timeout A
8: timeout B
```

The two matched. Reasoning: the call stack always finishes the current
synchronous run first (`1, 2, 3` — note the `await null` inside
`asyncFn` suspends it *after* logging `2`, so `3` still logs before the
function resumes). Once the stack is empty, the event loop drains the
**entire microtask queue** before touching anything else, so both
`Promise.resolve().then()` callbacks and the resumed `async` function
(`4, 5, 6`) run before either timer fires — in the order they were
queued. Only once the microtask queue is empty does the event loop pull
the next macrotask off the **task queue**, which is where the two
`setTimeout(..., 0)` callbacks (`7, 8`) finally run, even though they
were requested with a 0ms delay.

## Tasks vs. microtasks

- **Microtasks** (Promise `.then`/`.catch`/`.finally` callbacks, code
  after `await`, `queueMicrotask`) always run immediately after the
  current synchronous code finishes, and the *entire* microtask queue
  is drained before the event loop does anything else — including
  repainting the page or firing a `0ms` timer.
- **Tasks/macrotasks** (`setTimeout`, `setInterval`, DOM events, I/O
  callbacks) are handled one at a time, and the event loop checks the
  microtask queue again after *every single* macrotask, not just once.

In short: microtasks jump the queue ahead of any pending timer, no
matter how short that timer's delay is.

## Handling multiple Promises and errors

Each `task.run()` wraps its `await` in `try`/`catch`, so a rejected
Promise (a simulated failure) is caught locally and turned into
`status = 'failed'` instead of throwing an unhandled rejection — the UI
just shows the task as failed rather than crashing.

For running several tasks together, **Run All Tasks** uses
`Promise.allSettled(tasks.map(t => t.run()))` rather than
`Promise.all`. `Promise.all` rejects and stops waiting as soon as *any*
one promise rejects, which would hide the results of the tasks that
were still running. `Promise.allSettled` always waits for every promise
to either resolve or reject and gives back a result for each one, which
is what lets the board show a final status for every task and only
announce "All tasks finished" once all of them are truly done.

## Sequential vs. concurrent execution

```js
await task1.run();
await task2.run();
await task3.run();
```

Each `await` blocks the next line until that task's own timer finishes,
so the total time is roughly the **sum** of the three individual
delays (~500–2000ms each, so often 2–5 seconds total).

```js
await Promise.all([task1.run(), task2.run(), task3.run()]);
```

Here all three `run()` calls start immediately, one after another,
*before* any of them awaits — their timers all start ticking at
essentially the same moment. `Promise.all` then waits for all three to
resolve together, so total time is roughly the **max** of the three
delays, not the sum. The **Compare Sequential / Concurrent** button
measures both with `performance.now()` and logs the difference — on a
typical run concurrent is noticeably faster, and the gap grows the
more tasks are involved.
