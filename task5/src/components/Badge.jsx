export const STATUS_LABEL = { todo: "To do", in_progress: "In progress", done: "Done" };

export function StatusBadge({ status }) {
  return <span className={"badge status-" + status}>{STATUS_LABEL[status] ?? status}</span>;
}

export function PriorityBadge({ priority }) {
  return <span className={"badge prio-" + priority}>{priority}</span>;
}
