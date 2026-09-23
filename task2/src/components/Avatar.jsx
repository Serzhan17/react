// Placeholder "image" built as an SVG monogram badge, styled like a
// medal / belt-rank patch (nods to judo + football).
// To use a real photo instead: drop it in /public (e.g. photo.jpg)
// and replace the <svg> block below with:
//   <img src="/photo.jpg" alt="Serzhan" className="avatar__photo" />
export default function Avatar({ initials = 'S' }) {
  return (
    <div className="avatar">
      <svg viewBox="0 0 160 160" className="avatar__badge" role="img" aria-label="Serzhan monogram badge">
        <circle cx="80" cy="80" r="76" className="avatar__ring" />
        <circle cx="80" cy="80" r="62" className="avatar__disc" />
        <text x="80" y="102" textAnchor="middle" className="avatar__initials">{initials}</text>
      </svg>
    </div>
  );
}
