import { useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { getTask, updateTask, deleteTask } from "../services/service.js";
import { useAsync } from "../hooks/useAsync.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { StatusBadge, PriorityBadge } from "../components/Badge.jsx";

export default function TaskDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Re-fetches whenever :id changes; stale responses are ignored (see useAsync cleanup).
  const { data: task, loading, error, reload, setData } = useAsync(() => getTask(id), [id]);
  const [pending, setPending] = useState(null); // { type, id } while a mutation is in flight
  const [actionError, setActionError] = useState(null); // { id, message }

  useDocumentTitle(task ? task.title : "Task");

  function goBack() {
    // location.key === "default" means the page was opened directly (no history inside the app)
    if (location.key === "default") navigate("/tasks");
    else navigate(-1);
  }

  async function handleComplete() {
    if (pending || !task) return; // prevent conflicting actions
    const taskId = task.id; // capture the id before awaiting (stale closure protection)
    setPending({ type: "complete", id: taskId });
    setActionError(null);
    try {
      const updated = await updateTask(taskId, { status: "done" });
      setData((prev) => (prev && prev.id === updated.id ? updated : prev));
    } catch (err) {
      setActionError({ id: taskId, message: err.message });
    } finally {
      setPending(null);
    }
  }

  async function handleRemove() {
    if (pending || !task) return;
    if (!window.confirm("Remove this task?")) return;
    const taskId = task.id;
    setPending({ type: "remove", id: taskId });
    setActionError(null);
    try {
      await deleteTask(taskId);
      navigate("/tasks", { replace: true });
    } catch (err) {
      setActionError({ id: taskId, message: err.message });
    } finally {
      setPending(null);
    }
  }

  const nav = (
    <div className="actions top-links">
      <button onClick={goBack}>← Back</button>
      <Link to="/tasks" className="btn">All tasks</Link>
    </div>
  );

  if (loading) {
    return (
      <section>
        {nav}
        <p className="placeholder" aria-busy="true">Loading task…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        {nav}
        {error.status === 404 ? (
          <div className="panel center">
            <h1>Task not found</h1>
            <p>There is no task with ID “{id}”. It may have been removed.</p>
            <Link to="/tasks" className="btn primary">Back to all tasks</Link>
          </div>
        ) : (
          <div className="state">
            <p className="error" role="alert">{error.message}</p>
            <button onClick={reload}>Retry</button>
          </div>
        )}
      </section>
    );
  }

  const busy = pending !== null;
  const isDone = task.status === "done";
  const myAction = pending && pending.id === task.id ? pending.type : null;
  const dueHint =
    task.daysUntilDue === null
      ? ""
      : task.isOverdue
      ? ` (overdue by ${Math.abs(task.daysUntilDue)} d)`
      : isDone
      ? ""
      : task.daysUntilDue === 0
      ? " (due today)"
      : ` (in ${task.daysUntilDue} d)`;

  return (
    <section>
      {nav}
      <article className="panel">
        <h1>{task.title}</h1>
        <div className="row-meta">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
        </div>
        <p className="description">{task.description || "No description."}</p>
        <dl className="fields">
          <dt>Assignee</dt>
          <dd>{task.assignee}</dd>
          <dt>Due date</dt>
          <dd className={task.isOverdue ? "overdue" : ""}>{task.dueDate ? task.dueDate + dueHint : "—"}</dd>
          <dt>Estimate</dt>
          <dd>{task.estimateHours} h</dd>
          <dt>Tags</dt>
          <dd>{task.tags.length ? task.tags.map((t) => "#" + t).join(" ") : "—"}</dd>
          <dt>Created</dt>
          <dd>{new Date(task.createdAt).toLocaleDateString()} ({task.ageDays} days ago)</dd>
          <dt>Status</dt>
          <dd>{task.status.replace("_", " ")}</dd>
          <dt>Priority</dt>
          <dd>{task.priority}</dd>
          <dt>ID</dt>
          <dd>#{task.id}</dd>
        </dl>
        {actionError && actionError.id === task.id && (
          <p className="error" role="alert">{actionError.message}</p>
        )}
        <div className="actions">
          <button className="primary" onClick={handleComplete} disabled={busy || isDone}>
            {myAction === "complete" ? "Completing…" : isDone ? "Completed" : "Mark complete"}
          </button>
          <Link to={`/tasks/${task.id}/edit`} className={"btn" + (busy ? " disabled" : "")} aria-disabled={busy}>
            Edit
          </Link>
          <button className="danger" onClick={handleRemove} disabled={busy}>
            {myAction === "remove" ? "Removing…" : "Remove"}
          </button>
        </div>
      </article>
    </section>
  );
}
