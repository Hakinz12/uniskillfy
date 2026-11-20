import { useEffect, useRef, useState } from 'react';
import { Avatar, SwapIcon } from './ui.jsx';
import { badgeList, levelInfo, points } from '../data.js';
import { downloadCalendarEvent } from '../calendar.js';

function formatSession(session) {
  const date = new Date(session.start);
  const parts = new Intl.DateTimeFormat(undefined, {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: 'numeric', minute: '2-digit', hour12: true
  }).formatToParts(date);
  const part = type => parts.find(item => item.type === type)?.value;
  return `${part('weekday')} ${part('day')} ${part('month')}, ${part('hour')}:${part('minute')} ${part('dayPeriod')}, ${session.minutes} min`;
}

function ScheduleDialog({ request, onSave, onClose }) {
  const ref = useRef(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [minutes, setMinutes] = useState('30');
  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  useEffect(() => {
    if (request && ref.current && !ref.current.open) ref.current.showModal();
  }, [request]);

  function save(e) {
    e.preventDefault();
    const start = new Date(`${date}T${time}`);
    if (start.getTime() <= Date.now()) {
      ref.current.querySelector('input[type="time"]').setCustomValidity('Choose a time in the future.');
      ref.current.querySelector('input[type="time"]').reportValidity();
      return;
    }
    ref.current.querySelector('input[type="time"]').setCustomValidity('');
    onSave({ start: start.toISOString(), minutes: Number(minutes) });
    ref.current.close();
  }

  return (
    <dialog ref={ref} aria-labelledby="scheduleTitle" onClose={onClose} onClick={e => { if (e.target === ref.current) ref.current.close(); }}>
      <form className="dlg-body" onSubmit={save}>
        <h3 id="scheduleTitle">Schedule session</h3>
        <label className="field">
          <span>Date</span>
          <input type="date" aria-label="Date" value={date} min={minDate} required onChange={e => {
            ref.current.querySelector('input[type="time"]').setCustomValidity('');
            setDate(e.target.value);
          }} />
        </label>
        <label className="field">
          <span>Start time</span>
          <input type="time" aria-label="Start time" value={time} required onChange={e => {
            e.target.setCustomValidity('');
            setTime(e.target.value);
          }} />
        </label>
        <label className="field">
          <span>Duration</span>
          <select aria-label="Duration" value={minutes} onChange={e => setMinutes(e.target.value)}>
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">60 min</option>
          </select>
        </label>
        <div className="form-actions">
          <button className="btn primary" type="submit">Save session</button>
          <button className="btn ghost" type="button" onClick={() => ref.current.close()}>Cancel</button>
        </div>
      </form>
    </dialog>
  );
}

function ReviewDialog({ request, onSave, onClose }) {
  const ref = useRef(null);
  const [rating, setRating] = useState(request.review?.rating || 0);
  const [text, setText] = useState(request.review?.text || '');
  const [again, setAgain] = useState(request.review?.again || false);

  useEffect(() => {
    if (ref.current && !ref.current.open) ref.current.showModal();
  }, []);

  function save(e) {
    e.preventDefault();
    onSave({ rating: Number(rating), text: text.trim(), again, ts: Date.now() });
    ref.current.close();
  }

  return (
    <dialog ref={ref} aria-labelledby="reviewTitle" onClose={onClose} onClick={e => { if (e.target === ref.current) ref.current.close(); }}>
      <form className="dlg-body" onSubmit={save}>
        <h3 id="reviewTitle">Rate your swap with {request.mname}</h3>
        <fieldset className="field review-field">
          <legend>Rating</legend>
          <div className="review-stars">
            {[1, 2, 3, 4, 5].map(value => (
              <label key={value} className={rating === value ? 'selected' : ''}>
                <input
                  type="radio"
                  name={`rating-${request.id}`}
                  value={value}
                  aria-label={`${value} ${value === 1 ? 'star' : 'stars'}`}
                  checked={rating === value}
                  required
                  onChange={() => setRating(value)}
                />
                <span aria-hidden="true">★</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="field">
          <span>Review <i>(optional, up to 200 characters)</i></span>
          <textarea rows={4} maxLength={200} value={text} onChange={e => setText(e.target.value)} />
        </label>
        <label className="review-again">
          <input type="checkbox" checked={again} onChange={e => setAgain(e.target.checked)} />
          <span>I'd swap with them again</span>
        </label>
        <div className="form-actions">
          <button className="btn primary" type="submit">Save review</button>
          <button className="btn ghost" type="button" onClick={() => ref.current.close()}>Cancel</button>
        </div>
      </form>
    </dialog>
  );
}

function Request({ r, onAdvance, onCancel, onSchedule, onSaveReview }) {
  const [scheduling, setScheduling] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const when = new Date(r.ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return (
    <li className="req">
      <div className="req-top">
        <Avatar name={r.mname} />
        <div className="m-id"><strong>{r.mname}</strong><span>{r.mcollege}</span></div>
        <span className={`status ${r.status}`}>{r.status}</span>
      </div>
      <div className="trade">
        <div><small>You teach</small><b>{r.offer}</b></div>
        <SwapIcon className="arr" />
        <div><small>You learn</small><b>{r.learn}</b></div>
      </div>
      {r.msg && <p className="req-msg">“{r.msg}”</p>}
      {r.session && <p className="req-msg" aria-label="Scheduled session">{formatSession(r.session)}</p>}
      {r.review && (
        <div className="req-review">
          <p className="review-rating" role="img" aria-label={`Rated ${r.review.rating} out of 5 stars`}>
            {'★'.repeat(r.review.rating)}{'☆'.repeat(5 - r.review.rating)}
          </p>
          {r.review.text && <p>{r.review.text}</p>}
          {r.review.again && <p className="review-again-note">I'd swap with them again.</p>}
        </div>
      )}
      <div className="req-actions">
        <span className="when">Sent {when}</span>
        {r.status === 'pending' && <button className="btn ghost small" onClick={() => onAdvance(r.id)}>They accepted</button>}
        {r.status === 'accepted' && (
          <>
            <button className="btn ghost small" onClick={() => setScheduling(true)}>Schedule session</button>
            <button className="btn primary small" onClick={() => onAdvance(r.id)}>Mark session done</button>
          </>
        )}
        {r.status === 'done' && !r.review && <button className="btn primary small" onClick={() => setReviewing(true)}>Rate this swap</button>}
        {r.status === 'done' && r.review && <button className="btn ghost small" onClick={() => setReviewing(true)}>Edit review</button>}
        {r.session && <button className="btn ghost small" onClick={() => downloadCalendarEvent(r, r.session)}>Add to calendar</button>}
        {r.status !== 'done' && <button className="btn ghost small" onClick={() => onCancel(r.id)}>Cancel</button>}
      </div>
      {scheduling && (
        <ScheduleDialog
          request={r}
          onSave={session => { onSchedule(r.id, session); setScheduling(false); }}
          onClose={() => setScheduling(false)}
        />
      )}
      {reviewing && (
        <ReviewDialog
          request={r}
          onSave={review => { onSaveReview(r.id, review); setReviewing(false); }}
          onClose={() => setReviewing(false)}
        />
      )}
    </li>
  );
}

export default function Swaps({ profile, requests, onAdvance, onCancel, onSchedule, onSaveReview }) {
  const pts = points(requests);
  const lvl = levelInfo(pts);
  const badges = badgeList(profile, requests);

  return (
    <section className="section tinted" id="swaps">
      <div className="wrap">
        <div className="section-head">
          <h2>My swaps</h2>
          <p>Track your requests and watch your level climb.</p>
        </div>

        <div className="swaps-layout">
          <div className="card level">
            <div className="level-top">
              <div className="ring" style={{ '--p': lvl.pct }}><span>{pts}</span><small>pts</small></div>
              <div>
                <p className="level-name">{lvl.name}</p>
                <p className="level-next">{pts === 0 ? 'Send your first request to get started.' : lvl.next}</p>
              </div>
            </div>
            <h3 className="mini">Badges</h3>
            <ul className="badges">
              {badges.map(b => (
                <li key={b.name} className={b.on ? 'on' : ''}>
                  <span className="b-ico" aria-hidden="true">{b.ico}</span>
                  <div><strong>{b.name}</strong><span>{b.desc}</span></div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <ul className="req-list">
              {requests.map(r => <Request key={r.id} r={r} onAdvance={onAdvance} onCancel={onCancel} onSchedule={onSchedule} onSaveReview={onSaveReview} />)}
            </ul>
            {!requests.length && (
              <div className="empty slim">
                <h3>No swaps yet</h3>
                <p>When you request a swap from a match or the community grid, it lands here.</p>
                <a className="btn ghost small" href="#match">Find a swap</a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
