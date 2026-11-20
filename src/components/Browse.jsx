import { useMemo, useState } from 'react';
import { CommunityCard } from './Cards.jsx';
import { SearchIcon } from './ui.jsx';
import { CATS, SEED, catOf, norm } from '../data.js';

export default function Browse({ profile, onRequest }) {
  const [view, setView] = useState('teach');
  const [cat, setCat] = useState('All');
  const [query, setQuery] = useState('');

  const everyone = useMemo(() => (profile ? [{ ...profile, id: 'me', isMe: true }, ...SEED] : SEED), [profile]);
  const hasOther = everyone.some(c => [...c.teaches, ...c.wants].some(s => catOf(s) === 'Other'));
  const cats = ['All', ...Object.keys(CATS), ...(hasOther ? ['Other'] : [])];

  const list = useMemo(() => {
    const q = norm(query);
    return everyone.filter(c => {
      const skills = view === 'teach' ? c.teaches : c.wants;
      if (cat !== 'All' && !skills.some(s => catOf(s) === cat)) return false;
      if (!q) return true;
      return norm(c.name).includes(q) || norm(c.college).includes(q) || [...c.teaches, ...c.wants].some(s => norm(s).includes(q));
    });
  }, [everyone, view, cat, query]);

  return (
    <section className="section" id="browse">
      <div className="wrap">
        <div className="section-head">
          <h2>Browse the community</h2>
          <p>See who's teaching what. Filter by category or search a skill.</p>
        </div>

        <div className="toolbar">
          <label className="search">
            <SearchIcon />
            <input type="search" placeholder="Search a skill, name or college" aria-label="Search students" value={query} onChange={e => setQuery(e.target.value)} />
          </label>
          <div className="seg" role="group" aria-label="Show">
            {[['teach', 'Who can teach'], ['want', 'Who wants to learn']].map(([k, label]) => (
              <button key={k} className={'seg-btn' + (view === k ? ' on' : '')} aria-pressed={view === k} onClick={() => setView(k)}>{label}</button>
            ))}
          </div>
        </div>

        <div className="cats" role="group" aria-label="Categories">
          {cats.map(n => (
            <button key={n} className={'cat' + (n === cat ? ' on' : '')} aria-pressed={n === cat} onClick={() => setCat(n)}>{n}</button>
          ))}
        </div>

        <div className="grid">
          {list.map(c => <CommunityCard key={c.id} member={c} view={view} onRequest={onRequest} />)}
        </div>
        {!list.length && <p className="none">No one matches that yet. Be the first. Add yourself above.</p>}
      </div>
    </section>
  );
}
