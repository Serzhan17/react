import ProfileHero from './components/ProfileHero.jsx';
import AboutMe from './components/AboutMe.jsx';
import Interests from './components/Interests.jsx';
import Contact from './components/Contact.jsx';

export default function App() {
  return (
    <main className="page">
      <div className="card">
        <ProfileHero />
        <AboutMe />
        <Interests />
        <Contact />
      </div>
      <footer className="footer">Built with React · deployed on GitHub Pages</footer>
    </main>
  );
}
