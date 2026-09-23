const interests = [
  { label: 'Football', mark: '⚽' },
  { label: 'Coding', mark: '</>' },
  { label: 'Math', mark: '∑' },
  { label: 'Judo', mark: '柔' },
];

export default function Interests() {
  return (
    <section className="interests" aria-labelledby="interests-heading">
      <h2 id="interests-heading">What I'm into</h2>
      <ul className="interests__list">
        {interests.map((item) => (
          <li key={item.label} className="interests__item">
            <span className="interests__mark" aria-hidden="true">{item.mark}</span>
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
