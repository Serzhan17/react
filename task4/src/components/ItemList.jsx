const STATUS_LABEL = { todo: "To do", in_progress: "In progress", done: "Done" };

export default function ItemList({ items, selectedId, onSelect, disabled }) {
  return (
    <ul className="list">
      {items.map((item) => (
        <li key={item.id}>
          <button
            className={"row" + (item.id === selectedId ? " selected" : "")}
            onClick={() => onSelect(item.id)}
            disabled={disabled}
          >
            <span className="row-title">{item.title}</span>
            <span className="row-meta">
              <span className={"badge status-" + item.status}>{STATUS_LABEL[item.status]}</span>
              <span className={"badge prio-" + item.priority}>{item.priority}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
