import { useMemo, useRef, useState } from 'react';
import ChipInput from './ChipInput.jsx';
import { MatchCard } from './Cards.jsx';
import SwapCard from './SwapCard.jsx';
import { useToast } from './ui.jsx';
import { MODE_OPTIONS, SUGGEST_TEACH, SUGGEST_WANT, WHEN_OPTIONS, SEED, computeMatches, norm } from '../data.js';

const BLANK = { name: '', college: '', teaches: [], wants: [], when: WHEN_OPTIONS[0], mode: MODE_OPTIONS[0], bio: '' };
const DEMO = { name: 'Tolu Adebayo', college: 'Riverside Institute', teaches: ['Python', 'Excel'], wants: ['Guitar', 'French'], when: WHEN_OPTIONS[0], mode: MODE_OPTIONS[0], bio: 'Happy to explain things twice.' };

function validate(f) {
  return {
    name: f.name.trim() ? '' : 'Tell us your name.',
    college: f.college.trim() ? '' : 'Add your college or campus.',
    teaches: f.teaches.length ? '' : 'Add at least one skill you can teach.',
    wants: f.wants.length ? '' : 'Add at least one skill you want to learn.'
  };
}

export default function Match({ profile, requests, onSave, onReset, onRequest }) {
  const [form, setForm] = useState(profile || BLANK);
  const [errors, setErrors] = useState({});
  const resultsRef = useRef(null);
  const nameRef = useRef(null);
  const collegeRef = useRef(null);
  const teachesRef = useRef(null);
  const wantsRef = useRef(null);
  const toast = useToast();
  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k] && (typeof v === 'string' ? v.trim() : v.length)) {
      setErrors(current => ({ ...current, [k]: '' }));
    }
  };

  const matches = useMemo(() => (profile ? computeMatches(profile) : []), [profile]);
  const mutual = matches.filter(x => x.kind === 'mutual').length;

  function save(f) {
    setErrors({});
    onSave({ ...f, name: f.name.trim(), college: f.college.trim(), bio: f.bio.trim() });
    toast('Profile saved. Here are your matches!');
    if (window.innerWidth <= 900) resultsRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }
  function submit(e) {
    e.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    const firstInvalid = ['name', 'college', 'teaches', 'wants'].find(key => nextErrors[key]);
    if (firstInvalid) {
      ({ name: nameRef, college: collegeRef, teaches: teachesRef, wants: wantsRef }[firstInvalid]).current?.focus();
      return;
    }
    save(form);
  }
  function demo() { setForm(DEMO); save(DEMO); }
  function reset() {
    if (!window.confirm('Clear your profile and all your swaps from this device?')) return;
    setForm(BLANK);
    setErrors({});
    onReset();
    toast('All cleared.');
  }

  const suggestions = useMemo(() => {
    const wanted = new Set(form.wants.map(norm));
    return [...new Set(SEED.flatMap(student => student.teaches))]
      .filter(skill => !wanted.has(norm(skill)))
      .slice(0, 6);
  }, [form.wants]);

  function addSuggestedSkill(skill) {
    const wants = [...form.wants, skill];
    const updated = { ...form, wants };
    setForm(updated);
    if (errors.wants) setErrors(current => ({ ...current, wants: '' }));
    save(updated);
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
              <div className="field">
                <label htmlFor="fName">Your name</label>
                <input ref={nameRef} id="fName" type="text" maxLength={40} placeholder="e.g. Tolu Adebayo" autoComplete="name" value={form.name} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'nameError' : undefined} onChange={e => set('name', e.target.value)} />
                {errors.name && <small className="field-error" id="nameError" role="alert">{errors.name}</small>}
              </div>
              <div className="field">
                <label htmlFor="fCollege">College / campus</label>
                <input ref={collegeRef} id="fCollege" type="text" maxLength={50} placeholder="e.g. University of Ibadan" value={form.college} aria-invalid={!!errors.college} aria-describedby={errors.college ? 'collegeError' : undefined} onChange={e => set('college', e.target.value)} />
                {errors.college && <small className="field-error" id="collegeError" role="alert">{errors.college}</small>}
              </div>
            </div>

            <div className="field">
              <span id="teachLabel">I can teach</span>
              <ChipInput labelId="teachLabel" kind="teach" value={form.teaches} onChange={v => set('teaches', v)} suggestions={SUGGEST_TEACH} inputRef={teachesRef} invalid={!!errors.teaches} describedBy={errors.teaches ? 'teachesError' : undefined} />
              <small>Type a skill and press Enter, or tap a suggestion.</small>
              {errors.teaches && <small className="field-error" id="teachesError" role="alert">{errors.teaches}</small>}
            </div>

            <div className="field">
              <span id="wantLabel">I want to learn</span>
              <ChipInput labelId="wantLabel" kind="want" value={form.wants} onChange={v => set('wants', v)} suggestions={SUGGEST_WANT} inputRef={wantsRef} invalid={!!errors.wants} describedBy={errors.wants ? 'wantsError' : undefined} />
              {errors.wants && <small className="field-error" id="wantsError" role="alert">{errors.wants}</small>}
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
            {profile && <div className="swap-share-trigger"><SwapCard profile={profile} /></div>}
            {profile && !matches.length && (
              <div className="empty">
                <h3>No matches yet</h3>
                <p>Nobody lines up with those skills right now. Try adding a few more things you can teach or want to learn.</p>
                {!!suggestions.length && (
                  <div className="suggestion-skills" role="group" aria-label="Skills students can teach">
                    <p>Students can teach:</p>
                    <div className="suggest">
                      {suggestions.map(skill => <button key={skill} type="button" onClick={() => addSuggestedSkill(skill)}>+ {skill}</button>)}
                    </div>
                  </div>
                )}
              </div>
            )}
            {profile && matches.length > 0 && (
              <>
                <div className="res-head">
                  <h3>{matches.length} match{matches.length > 1 ? 'es' : ''} for {profile.name.split(' ')[0]}</h3>
                  <p>{mutual ? `${mutual} mutual swap${mutual > 1 ? 's' : ''}: you each have something the other wants.` : 'No mutual swaps yet, but these people can help.'}</p>
                </div>
                {matches.map(m => <MatchCard key={m.c.id} match={m} onRequest={onRequest} requests={requests} />)}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
