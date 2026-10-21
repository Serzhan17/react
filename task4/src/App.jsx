import { useState, useEffect } from "react";
import {
  listItems,
  getItem,
  createItem,
  updateItem,
  removeItem,
  resetDemoData,
  setSlowMode,
} from "./api.js";
import ItemList from "./components/ItemList.jsx";
import ItemDetails from "./components/ItemDetails.jsx";
import ItemForm from "./components/ItemForm.jsx";

export default function App() {
  // ----- list state -----
  const [items, setItems] = useState([]);
  const [listStatus, setListStatus] = useState("loading"); // loading | error | success
  const [listError, setListError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // ----- selection / details state -----
  const [selectedId, setSelectedId] = useState(null);
  const [details, setDetails] = useState(null);
  const [detailsStatus, setDetailsStatus] = useState("idle"); // idle | loading | error | success
  const [detailsError, setDetailsError] = useState("");
  const [detailsReloadKey, setDetailsReloadKey] = useState(0);

  // ----- mutations -----
  // { type: "complete" | "remove" | "save", id } while a request is in flight, otherwise null.
  const [pending, setPending] = useState(null);
  const [actionError, setActionError] = useState("");
  const [formMode, setFormMode] = useState(null); // null | "create" | "edit"
  const [formError, setFormError] = useState("");

  const [slow, setSlow] = useState(false);

  // 1) Load the list. Re-runs whenever reloadKey changes (Reload button).
  useEffect(() => {
    let cancelled = false;
    setListStatus("loading");
    setListError("");

    listItems()
      .then((data) => {
        if (cancelled) return;
        setItems(data);
        setListStatus("success");
      })
      .catch((err) => {
        if (cancelled) return;
        setListError(err.message);
        setListStatus("error");
      });

    // cleanup: a newer reload (or unmount) makes this response irrelevant
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // 2) Load details of the selected item. Race-condition safe thanks to the cleanup flag.
  useEffect(() => {
    if (selectedId === null) {
      setDetails(null);
      setDetailsStatus("idle");
      return;
    }

    let cancelled = false;
    setDetails(null); // never show the previous item's data under the new selection
    setDetailsStatus("loading");
    setDetailsError("");

    getItem(selectedId)
      .then((data) => {
        if (cancelled) return;
        setDetails(data);
        setDetailsStatus("success");
      })
      .catch((err) => {
        if (cancelled) return;
        setDetailsError(err.message);
        setDetailsStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId, detailsReloadKey]);

  // 3) Sync the "slow network" demo switch with the fake API module.
  useEffect(() => {
    setSlowMode(slow);
  }, [slow]);

  const busy = pending !== null;

  function handleSelect(id) {
    setActionError("");
    setFormMode(null);
    setSelectedId(id);
  }

  // Helper used by every mutation: keeps list rows in sync with the fresh server data.
  function applyUpdated(updated) {
    setItems((prev) =>
      prev.map((i) =>
        i.id === updated.id
          ? { id: updated.id, title: updated.title, status: updated.status, priority: updated.priority }
          : i
      )
    );
    // only touch the details panel if it still shows THIS item
    setDetails((d) => (d && d.id === updated.id ? updated : d));
  }

  async function handleComplete() {
    if (busy || selectedId === null) return; // prevent conflicting actions
    const id = selectedId; // capture the ID NOW — selection may change while we await
    setPending({ type: "complete", id });
    setActionError("");
    try {
      const updated = await updateItem(id, { status: "done" });
      applyUpdated(updated); // updates the correct item even if the user selected another one
    } catch (err) {
      // show the error only if the user is still looking at that item
      setSelectedId((current) => {
        if (current === id) setActionError(err.message);
        return current;
      });
    } finally {
      setPending(null);
    }
  }

  async function handleRemove() {
    if (busy || selectedId === null) return;
    const id = selectedId;
    if (!window.confirm("Remove this task?")) return;
    setPending({ type: "remove", id });
    setActionError("");
    try {
      await removeItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setSelectedId((current) => (current === id ? null : current));
    } catch (err) {
      setSelectedId((current) => {
        if (current === id) setActionError(err.message);
        return current;
      });
    } finally {
      setPending(null);
    }
  }

  async function handleSave(data) {
    if (busy) return;
    const editingId = formMode === "edit" ? selectedId : null;
    setPending({ type: "save", id: editingId });
    setFormError("");
    try {
      if (editingId === null) {
        const created = await createItem(data);
        setItems((prev) => [
          ...prev,
          { id: created.id, title: created.title, status: created.status, priority: created.priority },
        ]);
        setFormMode(null);
        setSelectedId(created.id);
      } else {
        const updated = await updateItem(editingId, data);
        applyUpdated(updated);
        setFormMode(null);
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setPending(null);
    }
  }

  async function handleReset() {
    if (busy) return;
    setPending({ type: "reset", id: null });
    try {
      await resetDemoData();
      setSelectedId(null);
      setFormMode(null);
      setReloadKey((k) => k + 1);
    } finally {
      setPending(null);
    }
  }

  function renderList() {
    if (listStatus === "loading") return <p className="placeholder" aria-busy="true">Loading tasks…</p>;
    if (listStatus === "error") {
      return (
        <div>
          <p className="error" role="alert">{listError}</p>
          <button onClick={() => setReloadKey((k) => k + 1)}>Try again</button>
        </div>
      );
    }
    if (items.length === 0) return <p className="placeholder">No tasks yet. Create the first one!</p>;
    return <ItemList items={items} selectedId={selectedId} onSelect={handleSelect} disabled={false} />;
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Task Tracker</h1>
        <div className="header-actions">
          <label className="switch">
            <input type="checkbox" checked={slow} onChange={(e) => setSlow(e.target.checked)} />
            Slow network (demo)
          </label>
          <button onClick={() => setReloadKey((k) => k + 1)} disabled={listStatus === "loading"}>
            ↻ Reload
          </button>
          <button
            className="primary"
            onClick={() => {
              setFormError("");
              setFormMode("create");
            }}
            disabled={busy}
          >
            + New task
          </button>
        </div>
      </header>

      <main className="layout">
        <section className="panel">
          <h2>Tasks</h2>
          {renderList()}
          <button className="link" onClick={handleReset} disabled={busy}>
            Reset demo data
          </button>
        </section>

        <section className="panel">
          {formMode === "create" && (
            <ItemForm
              key="create"
              initial={null}
              onSubmit={handleSave}
              onCancel={() => setFormMode(null)}
              saving={pending?.type === "save"}
              error={formError}
            />
          )}
          {formMode === "edit" && details && (
            <ItemForm
              key={"edit-" + details.id}
              initial={details}
              onSubmit={handleSave}
              onCancel={() => setFormMode(null)}
              saving={pending?.type === "save"}
              error={formError}
            />
          )}
          {formMode === null && (
            <ItemDetails
              status={detailsStatus}
              error={detailsError}
              details={details}
              busy={busy}
              pendingType={pending && pending.id === selectedId ? pending.type : null}
              onRetry={() => setDetailsReloadKey((k) => k + 1)}
              onComplete={handleComplete}
              onEdit={() => {
                setFormError("");
                setFormMode("edit");
              }}
              onRemove={handleRemove}
              actionError={actionError}
            />
          )}
        </section>
      </main>
    </div>
  );
}
