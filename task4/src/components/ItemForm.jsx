import { useState } from "react";

const EMPTY = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  assignee: "",
  dueDate: "",
  estimateHours: 1,
  tags: "",
};

function toFormState(item) {
  if (!item) return EMPTY;
  return { ...item, tags: item.tags.join(", ") };
}

export default function ItemForm({ initial, onSubmit, onCancel, saving, error }) {
  const [form, setForm] = useState(toFormState(initial));

  function change(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      priority: form.priority,
      assignee: form.assignee.trim() || "Unassigned",
      dueDate: form.dueDate,
      estimateHours: Number(form.estimateHours) || 0,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    });
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <h2>{initial ? "Edit task" : "New task"}</h2>
      <label>
        Title
        <input value={form.title} onChange={(e) => change("title", e.target.value)} required />
      </label>
      <label>
        Description
        <textarea rows={3} value={form.description} onChange={(e) => change("description", e.target.value)} />
      </label>
      <div className="form-grid">
        <label>
          Status
          <select value={form.status} onChange={(e) => change("status", e.target.value)}>
            <option value="todo">To do</option>
            <option value="in_progress">In progress</option>
            <option value="done">Done</option>
          </select>
        </label>
        <label>
          Priority
          <select value={form.priority} onChange={(e) => change("priority", e.target.value)}>
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
        </label>
        <label>
          Assignee
          <input value={form.assignee} onChange={(e) => change("assignee", e.target.value)} />
        </label>
        <label>
          Due date
          <input type="date" value={form.dueDate} onChange={(e) => change("dueDate", e.target.value)} />
        </label>
        <label>
          Estimate (hours)
          <input
            type="number"
            min="0"
            value={form.estimateHours}
            onChange={(e) => change("estimateHours", e.target.value)}
          />
        </label>
        <label>
          Tags (comma separated)
          <input value={form.tags} onChange={(e) => change("tags", e.target.value)} />
        </label>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="actions">
        <button type="submit" className="primary" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}
