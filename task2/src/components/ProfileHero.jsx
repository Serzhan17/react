import Avatar from './Avatar.jsx';

export default function ProfileHero() {
  return (
    <header className="hero">
      <Avatar initials="S" />
      <div className="hero__text">
        <p className="hero__eyebrow">Player card</p>
        <h1 className="hero__name">Serzhan</h1>
        <p className="hero__tagline">Codes by day, plays by instinct.</p>
      </div>
    </header>
  );
}
