import { useMemo, useRef, useState } from 'react';
import ChipInput from './ChipInput.jsx';
import { MatchCard } from './Cards.jsx';
import { useToast } from './ui.jsx';
import { MODE_OPTIONS, SUGGEST_TEACH, SUGGEST_WANT, WHEN_OPTIONS, computeMatches } from '../data.js';

const BLANK = { name: '', college: '', teaches: [], wants: [], when: WHEN_OPTIONS[0], mode: MODE_OPTIONS[0], bio: '' };
const DEMO = { name: 'Tolu Adebayo', college: 'Riverside Institute', teaches: ['Python', 'Excel'], wants: ['Guitar', 'French'], when: WHEN_OPTIONS[0], mode: MODE_OPTIONS[0], bio: 'Happy to explain things twice.' };

function validate(f) {
  if (!f.name.trim()) return 'Tell us your name.';
  if (!f.college.trim()) return 'Add your college or campus.';
  if (!f.teaches.length) return 'Add at least one skill you can teach.';
  if (!f.wants.length) return 'Add at least one skill you want to learn.';
  return '';
}

export default function Match({ profile, onSave, onReset, onRequest }) {
  const [form, setForm] = useState(profile || BLANK);
  const [error, setError] = useState('');
  const resultsRef = useRef(null);
  const toast = useToast();
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const matches = useMemo(() => (profile ? computeMatches(profile) : []), [profile]);
  const mutual = matches.filter(x => x.kind === 'mutual').length;

  function save(f) {
    setError('');
    onSave({ ...f, name: f.name.trim(), college: f.college.trim(), bio: f.bio.trim() });
    toast('Profile saved. Here are your matches!');
    if (window.innerWidth <= 900) resultsRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }
  function submit(e) {
    e.preventDefault();
    const msg = validate(form);
    setError(msg);
    if (!msg) save(form);
  }
  function demo() { setForm(DEMO); save(DEMO); }
  function reset() {
    if (!window.confirm('Clear your profile and all your swaps from this device?')) return;
    setForm(BLANK);
    setError('');
    onReset();
    toast('All cleared.');
  }

  return (
    <section className="section tinted" id="match">
      <div className="wrap">
        <div className="section-head">
          <h2>Find my swap</h2>
          <p>Fill this in once. We save it on your device and use it every time you send a request.</p>
        </div>

        <div className="match-layout">
          <form className="card form" onSubmit={submit} noValidate>
            <div className="field-row">
              <label className="field">
                <span>Your name</span>
                <input id="fName" type="text" maxLength={40} placeholder="e.g. Tolu Adebayo" autoComplete="name" value={form.name} onChange={e => set('name', e.target.value)} />
              </label>
              <label className="field">
                <span>College / campus</span>
                <input id="fCollege" type="text" maxLength={50} placeholder="e.g. University of Ibadan" value={form.college} onChange={e => set('college', e.target.value)} />
              </label>
            </div>

            <div className="field">
              <span id="teachLabel">I can teach</span>
              <ChipInput labelId="teachLabel" kind="teach" value={form.teaches} onChange={v => set('teaches', v)} suggestions={SUGGEST_TEACH} />
              <small>Type a skill and press Enter, or tap a suggestion.</small>
            </div>

            <div className="field">
              <span id="wantLabel">I want to learn</span>
              <ChipInput labelId="wantLabel" kind="want" value={form.wants} onChange={v => set('wants', v)} suggestions={SUGGEST_WANT} />
            </div>

            <div className="field-row">
              <label className="field">
                <span>When are you free?</span>
                <select value={form.when} onChange={e => set('when', e.target.value)}>
                  {WHEN_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Session style</span>
                <select value={form.mode} onChange={e => set('mode', e.target.value)}>
                  {MODE_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </label>
            </div>

            <label className="field">
              <span>One line about you <i>(optional)</i></span>
              <input type="text" maxLength={90} placeholder="e.g. I explain things with too many analogies." value={form.bio} onChange={e => set('bio', e.target.value)} />
            </label>

            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="form-actions">
              <button className="btn primary" type="submit">Find matches</button>
              <button className="btn ghost" type="button" onClick={reset}>Reset my data</button>
            </div>
          </form>

          <div className="results" ref={resultsRef} aria-live="polite">
            {!profile && (
              <div className="empty">
                <div className="empty-ico" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
                </div>
                <h3>Your matches will show up here</h3>
                <p>Add at least one skill you can teach and one you want to learn, then hit <b>Find matches</b>.</p>
                <button className="btn ghost small" type="button" onClick={demo}>Fill with example data</button>
              </div>
            )}
            {profile && !matches.length && (
              <div className="empty">
                <h3>No matches yet</h3>
                <p>Nobody lines up with those skills right now. Try adding a few more things you can teach or want to learn.</p>
              </div>
            )}
            {profile && matches.length > 0 && (
              <>
                <div className="res-head">
                  <h3>{matches.length} match{matches.length > 1 ? 'es' : ''} for {profile.name.split(' ')[0]}</h3>
                  <p>{mutual ? `${mutual} mutual swap${mutual > 1 ? 's' : ''}: you each have something the other wants.` : 'No mutual swaps yet, but these people can help.'}</p>
                </div>
                {matches.map(m => <MatchCard key={m.c.id} match={m} onRequest={onRequest} />)}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
