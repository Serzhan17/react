import { useState, useEffect } from "react";
import { subscribeToUpdate, applyUpdate } from "../services/pwa.js";

// "A new version is available" toast with an Update button.
export default function UpdatePrompt() {
  const [available, setAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => subscribeToUpdate(setAvailable), []);

  if (!available || dismissed) return null;
  return (
    <div className="toast" role="alert">
      <span>A new version is available.</span>
      <button className="primary" onClick={applyUpdate}>Update</button>
      <button onClick={() => setDismissed(true)}>Later</button>
    </div>
  );
}
