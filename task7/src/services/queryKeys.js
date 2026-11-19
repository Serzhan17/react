// Query keys for the cache. Hierarchical, so a whole group can be invalidated by prefix.
export const taskKeys = {
  all: ["tasks"],
  list: (query) => ["tasks", "list", query],
  detail: (id) => ["tasks", "detail", String(id)],
  everything: ["tasks", "all"], // full dataset used by the dashboard
};
