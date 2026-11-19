import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { createTask, updateTask } from "../services/service.js";
import { useTask } from "../hooks/useTasks.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import QueryError from "../components/QueryError.jsx";
import TaskForm from "../components/TaskForm.jsx";

// Used for both /tasks/new and /tasks/:id/edit
export default function TaskFormPage() {
  const { id } = useParams();
  const isEdit = id !== undefined;
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const { data: task, loading, error, reload } = useTask(id, { enabled: isEdit });
  useDocumentTitle(isEdit ? "Edit task" : "New task");

  async function handleSubmit(values) {
    if (saving) return;
    setSaving(true);
    setFormError("");
    try {
      const saved = isEdit ? await updateTask(Number(id), values) : await createTask(values);
      navigate(`/tasks/${saved.id}`);
    } catch (err) {
      setFormError(err.message);
      setSaving(false);
    }
  }

  if (loading) return <p className="placeholder" aria-busy="true">Loading…</p>;

  if (error) {
    return error.status === 404 ? (
      <section className="panel center">
        <h1>Task not found</h1>
        <Link to="/tasks" className="btn primary">Back to all tasks</Link>
      </section>
    ) : (
      <QueryError error={error} onRetry={reload} />
    );
  }

  return (
    <section className="panel">
      <h1>{isEdit ? "Edit task" : "New task"}</h1>
      <TaskForm
        key={isEdit ? "edit-" + id : "new"}
        initial={task}
        onSubmit={handleSubmit}
        onCancel={() => navigate(isEdit ? `/tasks/${id}` : "/tasks")}
        saving={saving}
        error={formError}
      />
    </section>
  );
}
