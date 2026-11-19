// Tiny server-state cache (the idea behind TanStack Query, in ~50 lines).
//
// - Entries are stored under a query key (array) with a timestamp.
// - An entry is "fresh" for `staleTime` ms; after that it is stale and gets revalidated.
// - Identical requests running at the same time share one promise (deduplication).
// - invalidate(prefix) removes every entry whose key starts with that prefix.
// - An "epoch" counter makes sure a response that was requested BEFORE an invalidation
//   can never be written into the cache afterwards (no outdated data overwriting newer data).

export const DEFAULT_STALE_TIME = 30_000; // 30 seconds

const store = new Map(); // serialized key -> { key, data, time }
const inflight = new Map(); // serialized key -> { key, promise }
let epoch = 0;

const serialize = (key) => JSON.stringify(key);

function startsWith(key, prefix) {
  return prefix.every((part, i) => JSON.stringify(part) === JSON.stringify(key[i]));
}

export function peekEntry(key) {
  const entry = store.get(serialize(key));
  return entry ? { data: entry.data, age: Date.now() - entry.time } : null;
}

export function setCache(key, data) {
  store.set(serialize(key), { key, data, time: Date.now() });
}

export function invalidate(prefix) {
  epoch += 1;
  for (const [id, entry] of store) {
    if (startsWith(entry.key, prefix)) store.delete(id);
  }
  for (const [id, request] of inflight) {
    if (startsWith(request.key, prefix)) inflight.delete(id);
  }
}

export function fetchCached(key, fetcher, { staleTime = DEFAULT_STALE_TIME } = {}) {
  const id = serialize(key);
  const entry = store.get(id);
  if (entry && Date.now() - entry.time < staleTime) return Promise.resolve(entry.data);

  const running = inflight.get(id);
  if (running) return running.promise;

  const startEpoch = epoch;
  const promise = fetcher()
    .then((data) => {
      if (epoch === startEpoch) setCache(key, data);
      return data;
    })
    .finally(() => {
      if (inflight.get(id)?.promise === promise) inflight.delete(id);
    });
  inflight.set(id, { key, promise });
  return promise;
}
