// Keep this section limited to safe, public info — no phone number
// or home address. Swap the placeholders below for your real handles.
const contactItems = [
  { label: 'Email', value: 's_abdykadyr@kbtu.kz', href: 'mailto:s_abdykadyr@kbtu.kz' },
  { label: 'GitHub', value: '@Serzhan17', href: 'https://github.com/Serzhan17/react' },
  { label: 'Location', value: 'Wherever the ball is' },
];

export default function Contact() {
  return (
    <section className="contact" aria-labelledby="contact-heading">
      <h2 id="contact-heading">Get in touch</h2>
      <dl className="contact__list">
        {contactItems.map((item) => (
          <div className="contact__row" key={item.label}>
            <dt>{item.label}</dt>
            <dd>
              {item.href ? <a href={item.href}>{item.value}</a> : item.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
