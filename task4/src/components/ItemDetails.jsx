const STATUS_LABEL = { todo: "To do", in_progress: "In progress", done: "Done" };

export default function ItemDetails({
  status, // "idle" | "loading" | "error" | "success"
  error,
  details,
  busy, // true while any mutation is pending
  pendingType,
  onRetry,
  onComplete,
  onEdit,
  onRemove,
  actionError,
}) {
  if (status === "idle") {
    return <p className="placeholder">Select a task to see its details.</p>;
  }
  if (status === "loading") {
    return <p className="placeholder" aria-busy="true">Loading details…</p>;
  }
  if (status === "error") {
    return (
      <div>
        <p className="error" role="alert">{error}</p>
        <button onClick={onRetry}>Retry</button>
      </div>
    );
  }

  const isDone = details.status === "done";

  return (
    <div>
      <h2>{details.title}</h2>
      <p className="description">{details.description || "No description."}</p>
      <dl className="fields">
        <dt>Status</dt>
        <dd>{STATUS_LABEL[details.status]}</dd>
        <dt>Priority</dt>
        <dd>{details.priority}</dd>
        <dt>Assignee</dt>
        <dd>{details.assignee}</dd>
        <dt>Due date</dt>
        <dd>{details.dueDate || "—"}</dd>
        <dt>Estimate</dt>
        <dd>{details.estimateHours} h</dd>
        <dt>Tags</dt>
        <dd>{details.tags.length ? details.tags.join(", ") : "—"}</dd>
        <dt>Created</dt>
        <dd>
          {new Date(details.createdAt).toLocaleDateString()} ({details.ageDays} days ago)
        </dd>
      </dl>
      {actionError && <p className="error" role="alert">{actionError}</p>}
      <div className="actions">
        <button className="primary" onClick={onComplete} disabled={busy || isDone}>
          {pendingType === "complete" ? "Completing…" : isDone ? "Completed" : "Mark complete"}
        </button>
        <button onClick={onEdit} disabled={busy}>Edit</button>
        <button className="danger" onClick={onRemove} disabled={busy}>
          {pendingType === "remove" ? "Removing…" : "Remove"}
        </button>
      </div>
    </div>
  );
}
