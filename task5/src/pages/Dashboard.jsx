import { useState } from "react";
import { Link } from "react-router-dom";
import { getTasks } from "../services/service.js";
import { useAsync } from "../hooks/useAsync.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import StatCard from "../components/StatCard.jsx";
import BarList from "../components/BarList.jsx";
import { STATUS_LABEL } from "../components/Badge.jsx";

export default function Dashboard() {
  useDocumentTitle("Dashboard");
  const { data, loading, error, reload } = useAsync(() => getTasks({ limit: 1000 }), []);
  const [assignee, setAssignee] = useState(""); // interactive filter: affects all statistics

  if (loading) return <p className="placeholder" aria-busy="true">Loading dashboard…</p>;
  if (error) {
    return (
      <div className="state">
        <p className="error" role="alert">{error.message}</p>
        <button onClick={reload}>Retry</button>
      </div>
    );
  }

  const tasks = data.items.filter((t) => !assignee || t.assignee === assignee);
  if (data.items.length === 0) {
    return <p className="placeholder">No data yet. <Link to="/tasks/new">Create a task</Link>.</p>;
  }

  const today = new Date().toISOString().slice(0, 10);
  const open = tasks.filter((t) => t.status !== "done");
  const done = tasks.length - open.length;
  const overdue = open.filter((t) => t.dueDate && t.dueDate < today);
  const totalHours = tasks.reduce((sum, t) => sum + t.estimateHours, 0);
  const remainingHours = open.reduce((sum, t) => sum + t.estimateHours, 0);
  const completion = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  const who = assignee ? `&assignee=${encodeURIComponent(assignee)}` : "";
  const byStatus = ["todo", "in_progress", "done"].map((s) => ({
    label: STATUS_LABEL[s],
    value: tasks.filter((t) => t.status === s).length,
    to: `/tasks?status=${s}${who}`,
  }));
  const byPriority = ["high", "medium", "low"].map((p) => ({
    label: p,
    value: tasks.filter((t) => t.priority === p).length,
    to: `/tasks?priority=${p}${who}`,
  }));
  const tagCounts = {};
  tasks.forEach((t) => t.tags.forEach((tag) => (tagCounts[tag] = (tagCounts[tag] || 0) + 1)));
  const byTag = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, value]) => ({ label: "#" + tag, value, to: `/tasks?q=${encodeURIComponent(tag)}${who}` }));

  const upcoming = open
    .filter((t) => t.dueDate)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  return (
    <section>
      <div className="page-head">
        <h1>Dashboard</h1>
        <div className="actions">
          <select value={assignee} onChange={(e) => setAssignee(e.target.value)} aria-label="Filter by assignee">
            <option value="">All assignees</option>
            {data.assignees.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <button onClick={reload}>↻ Reload</button>
        </div>
      </div>

      <div className="stats">
        <StatCard label="Total tasks" value={tasks.length} to={`/tasks${assignee ? "?assignee=" + encodeURIComponent(assignee) : ""}`} />
        <StatCard label="Completion" value={completion + "%"} hint={`${done} of ${tasks.length} done`} />
        <StatCard label="Overdue" value={overdue.length} hint="open tasks past due date" to="/tasks?sort=dueDate&order=asc" />
        <StatCard label="Estimated hours" value={totalHours + " h"} hint={`${remainingHours} h remaining`} />
      </div>

      <div className="two-col">
        <BarList title="By status" rows={byStatus} />
        <BarList title="By priority" rows={byPriority} />
        <BarList title="Top tags" rows={byTag} />
        <section className="panel">
          <h2>Upcoming deadlines</h2>
          {upcoming.length === 0 && <p className="placeholder">Nothing due. 🎉</p>}
          <ul className="simple-list">
            {upcoming.map((t) => (
              <li key={t.id}>
                <Link to={`/tasks/${t.id}`}>{t.title}</Link>
                <span className={t.dueDate < today ? "overdue" : "muted"}>{t.dueDate}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}
