import { SwapIcon } from './ui.jsx';
import { useCountUp } from '../hooks/useAppState.js';

export function Nav({ openCount, onToggleTheme, onStartTour, showInstall, onInstall, showIosHint, onDismissIosHint }) {
  return (
    <header className="nav">
      <div className="wrap nav-inner">
        <a href="#top" className="brand" aria-label="Uniskillfy home">
          <span className="brand-mark"><img src="/icon.svg" alt="" width="34" height="34" /></span>
          <span><b>Uni</b>skillfy</span>
        </a>
        <nav className="nav-links" aria-label="Primary">
          <a href="#how">How it works</a>
          <a href="#match">Find my swap</a>
          <a href="#browse">Browse</a>
          <a href="#swaps">My swaps {openCount > 0 && <span className="pill">{openCount}</span>}</a>
          <a href="#top" onClick={e => { e.preventDefault(); onStartTour(); }}>Take the tour</a>
        </nav>
        {showInstall && <button className="btn ghost small install-btn" type="button" onClick={onInstall}>Install Uniskillfy</button>}
        <button className="icon-btn" onClick={onToggleTheme} aria-label="Toggle dark mode" title="Toggle dark mode">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
          </svg>
        </button>
      </div>
      {showIosHint && (
        <div className="ios-install-hint" role="status">
          <span>To install Uniskillfy, tap Share, then Add to Home Screen</span>
          <button type="button" aria-label="Dismiss install hint" onClick={onDismissIosHint}>×</button>
        </div>
      )}
    </header>
  );
}

export function Hero({ members, skills, swaps }) {
  const m = useCountUp(members), s = useCountUp(skills), w = useCountUp(swaps);
  return (
    <section className="hero" id="top">
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">Swap skills on campus</p>
          <h1>Trade what you <span className="hl">know</span> for what you want to <span className="hl alt">learn</span>.</h1>
          <p className="lead">You're good at something. Someone on campus is dying to learn it, and they're good at the thing you've been putting off. Uniskillfy puts you two in the same room.</p>
          <div className="cta-row">
            <a className="btn primary" href="#match">Find my swap</a>
            <a className="btn ghost" href="#browse">Browse students</a>
          </div>
          <dl className="stats" aria-label="Community stats">
            <div><dt>Students</dt><dd>{m}</dd></div>
            <div><dt>Skills on offer</dt><dd>{s}</dd></div>
            <div><dt>Swaps done</dt><dd>{w}</dd></div>
          </dl>
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="swap-card a">
            <div className="avatar" style={{ '--h': 262 }}>AM</div>
            <div><strong>Amara</strong><span>teaches Python</span></div>
            <em>wants Guitar</em>
          </div>
          <div className="swap-arrows"><SwapIcon size={34} /></div>
          <div className="swap-card b">
            <div className="avatar" style={{ '--h': 18 }}>RK</div>
            <div><strong>Rohan</strong><span>teaches Guitar</span></div>
            <em>wants Python</em>
          </div>
          <div className="match-badge">100% match</div>
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  ['Tell us your trade', 'List what you can teach and what you want to learn. Add as many as you like.'],
  ['Get matched', 'Our matcher scores every student by how well your skills line up, and puts mutual swaps first.'],
  ['Swap and level up', 'Send a request, run your session, mark it done. Earn points and badges as you go.']
];

export function HowItWorks() {
  return (
    <section className="section" id="how">
      <div className="wrap">
        <h2>Three steps. No money. No awkward cold messages.</h2>
        <ol className="steps">
          {STEPS.map(([t, d], i) => (
            <li key={t}><span className="num">{i + 1}</span><h3>{t}</h3><p>{d}</p></li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Footer({ onStartTour }) {
  return (
    <footer className="footer">
      <div className="wrap foot-inner">
        <p><b>Uniskillfy</b> · A student-built peer learning project for the Build Your Own Website hackathon.</p>
        <p className="muted">Demo data is fictional. Your profile and swaps are stored only in your browser.</p>
        <p><a href="#top" onClick={e => { e.preventDefault(); onStartTour(); }}>Take the tour</a></p>
      </div>
    </footer>
  );
}
