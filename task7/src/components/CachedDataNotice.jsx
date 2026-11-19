// Shown when the data on screen came from the Service Worker cache instead of the network.
export default function CachedDataNotice({ onRefresh }) {
  return (
    <div className="banner cached-notice" role="status">
      <span>📦 You are viewing saved (cached) data. It may be out of date.</span>
      {onRefresh && <button onClick={onRefresh}>Refresh</button>}
    </div>
  );
}
