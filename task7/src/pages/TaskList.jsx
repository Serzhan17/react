import { useSearchParams, Link } from "react-router-dom";
import { useState } from "react";
import { resetDemoData } from "../services/service.js";
import { useTasks } from "../hooks/useTasks.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import QueryError from "../components/QueryError.jsx";
import CachedDataNotice from "../components/CachedDataNotice.jsx";
import TaskCard from "../components/TaskCard.jsx";
import Pagination from "../components/Pagination.jsx";

const PAGE_SIZE = 6;

export default function TaskList() {
  useDocumentTitle("Tasks");
  const [params, setParams] = useSearchParams();
  const [resetting, setResetting] = useState(false);

  // The URL is the single source of truth for search, filters, sorting and page.
  const query = {
    q: params.get("q") || "",
    status: params.get("status") || "",
    priority: params.get("priority") || "",
    assignee: params.get("assignee") || "",
    sort: params.get("sort") || "createdAt",
    order: params.get("order") || "desc",
    page: Number(params.get("page")) || 1,
  };

  const { data, loading, error, reload } = useTasks({ ...query, limit: PAGE_SIZE });

  function setParam(key, value) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        if (key !== "page") next.delete("page"); // any filter change goes back to page 1
        return next;
      },
      { replace: key === "q" }
    );
  }

  async function handleReset() {
    setResetting(true);
    await resetDemoData();
    setParams({});
    reload();
    setResetting(false);
  }

  const hasFilters = query.q || query.status || query.priority || query.assignee;
  const assignees = data?.assignees ?? [];

  function renderResults() {
    if (error) return <QueryError error={error} onRetry={reload} />;
    if (!data) return <p className="placeholder" aria-busy="true">Loading tasks…</p>;
    if (data.items.length === 0) {
      return (
        <div className="state">
          <p className="placeholder">
            {hasFilters ? "No tasks match your search or filters." : "No tasks yet. Create the first one!"}
          </p>
          {hasFilters && <button onClick={() => setParams({})}>Clear filters</button>}
        </div>
      );
    }
    return (
      <>
        {data.fromCache && <CachedDataNotice onRefresh={reload} />}
        <p className="muted">
          {data.total} task{data.total === 1 ? "" : "s"} found {loading && <span>· updating…</span>}
        </p>
        <div className={"grid" + (loading ? " dim" : "")}>
          {data.items.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
        <Pagination page={data.page} totalPages={data.totalPages} onChange={(p) => setParam("page", p === 1 ? "" : String(p))} />
      </>
    );
  }

  return (
    <section>
      <div className="page-head">
        <h1>Tasks</h1>
        <div className="actions">
          <button onClick={reload} disabled={loading}>↻ Reload</button>
          <Link to="/tasks/new" className="btn primary">+ New task</Link>
        </div>
      </div>

      <div className="filters panel">
        <input
          type="search"
          placeholder="Search by title, description or tag…"
          value={query.q}
          onChange={(e) => setParam("q", e.target.value)}
          aria-label="Search"
        />
        <select value={query.status} onChange={(e) => setParam("status", e.target.value)} aria-label="Status">
          <option value="">All statuses</option>
          <option value="todo">To do</option>
          <option value="in_progress">In progress</option>
          <option value="done">Done</option>
        </select>
        <select value={query.priority} onChange={(e) => setParam("priority", e.target.value)} aria-label="Priority">
          <option value="">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={query.assignee} onChange={(e) => setParam("assignee", e.target.value)} aria-label="Assignee">
          <option value="">All assignees</option>
          {query.assignee && !assignees.includes(query.assignee) && <option value={query.assignee}>{query.assignee}</option>}
          {assignees.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select value={query.sort} onChange={(e) => setParam("sort", e.target.value === "createdAt" ? "" : e.target.value)} aria-label="Sort by">
          <option value="createdAt">Sort: created</option>
          <option value="title">Sort: title</option>
          <option value="dueDate">Sort: due date</option>
          <option value="priority">Sort: priority</option>
          <option value="estimateHours">Sort: estimate</option>
        </select>
        <select value={query.order} onChange={(e) => setParam("order", e.target.value === "desc" ? "" : e.target.value)} aria-label="Order">
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>

      {renderResults()}

      <button className="link" onClick={handleReset} disabled={resetting}>
        Reset demo data
      </button>
    </section>
  );
}
