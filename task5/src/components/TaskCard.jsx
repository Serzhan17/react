import { Link } from "react-router-dom";
import { StatusBadge, PriorityBadge } from "./Badge.jsx";

export default function TaskCard({ task }) {
  return (
    <Link to={`/tasks/${task.id}`} className="card">
      <h3>{task.title}</h3>
      <p className="card-text">{task.description}</p>
      <div className="row-meta">
        <StatusBadge status={task.status} />
        <PriorityBadge priority={task.priority} />
      </div>
      <div className="card-foot">
        <span>👤 {task.assignee}</span>
        <span>📅 {task.dueDate || "no due date"}</span>
      </div>
      {task.tags.length > 0 && (
        <div className="tags">
          {task.tags.map((t) => (
            <span key={t} className="tag">#{t}</span>
          ))}
        </div>
      )}
    </Link>
  );
}
