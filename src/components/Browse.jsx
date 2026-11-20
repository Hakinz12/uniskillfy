import { useMemo, useState } from 'react';
import { CommunityCard } from './Cards.jsx';
import { SearchIcon } from './ui.jsx';
import { CATS, SEED, catOf, norm, ratingInfo } from '../data.js';

export default function Browse({ profile, requests, onRequest }) {
  const [view, setView] = useState('teach');
  const [cat, setCat] = useState('All');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('current');

  const everyone = useMemo(() => (profile ? [{ ...profile, id: 'me', isMe: true }, ...SEED] : SEED), [profile]);
  const hasOther = everyone.some(c => [...c.teaches, ...c.wants].some(s => catOf(s) === 'Other'));
  const cats = ['All', ...Object.keys(CATS), ...(hasOther ? ['Other'] : [])];

  const list = useMemo(() => {
    const q = norm(query);
    const filtered = everyone.filter(c => {
      const skills = view === 'teach' ? c.teaches : c.wants;
      if (cat !== 'All' && !skills.some(s => catOf(s) === cat)) return false;
      if (!q) return true;
      return norm(c.name).includes(q) || norm(c.college).includes(q) || [...c.teaches, ...c.wants].some(s => norm(s).includes(q));
    });
    if (sort === 'current') return filtered;
    return filtered
      .map((member, index) => ({ member, index, rating: ratingInfo(member, requests)?.average ?? -1 }))
      .sort((a, b) => b.rating - a.rating || a.index - b.index)
      .map(item => item.member);
  }, [everyone, view, cat, query, sort, requests]);

  function clearFilters() {
    setQuery('');
    setCat('All');
    setView('teach');
    setSort('current');
  }

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
          <label className="sort-control">
            <span>Sort by</span>
            <select aria-label="Sort by" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="current">Current order</option>
              <option value="rating">Top rated</option>
            </select>
          </label>
        </div>

        <div className="cats" role="group" aria-label="Categories">
          {cats.map(n => (
            <button key={n} className={'cat' + (n === cat ? ' on' : '')} aria-pressed={n === cat} onClick={() => setCat(n)}>{n}</button>
          ))}
        </div>

        <div className="grid">
          {list.map(c => <CommunityCard key={c.id} member={c} view={view} onRequest={onRequest} requests={requests} />)}
        </div>
        {!list.length && (
          <div className="empty slim">
            <h3>No search results</h3>
            <p>No one matches that yet. Try another search or clear your filters.</p>
            <button className="btn ghost small" type="button" onClick={clearFilters}>Clear filters</button>
          </div>
        )}
      </div>
    </section>
  );
}
