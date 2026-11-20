import { useEffect, useRef, useState } from 'react';
import { Avatar, SwapIcon } from './ui.jsx';
import { badgeList, computeStreak, goalProgress, levelInfo, points, weekStart } from '../data.js';
import { downloadCalendarEvent } from '../calendar.js';
import { useToast } from './ui.jsx';

const CUSTOM_SKILL = '__custom__';

function GoalsCard({ profile, goals, requests, onAddGoal, onRemoveGoal }) {
  const [skillChoice, setSkillChoice] = useState('');
  const [customSkill, setCustomSkill] = useState('');
  const [target, setTarget] = useState('3');
  const selectedSkill = skillChoice || profile?.wants?.[0] || CUSTOM_SKILL;

  function addGoal(e) {
    e.preventDefault();
    const skill = (selectedSkill === CUSTOM_SKILL ? customSkill : selectedSkill).trim();
    if (!skill) return;
    onAddGoal({
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      skill,
      target: Number(target),
      createdAt: Date.now()
    });
    setCustomSkill('');
    setTarget('3');
  }

  return (
    <section className="card goals-card" aria-labelledby="goalsTitle">
      <h3 id="goalsTitle">Learning goals</h3>
      {goals.length ? (
        <ul className="goal-list">
          {goals.map(goal => {
            const progress = goalProgress(goal, requests);
            return (
              <li className="goal-item" key={goal.id}>
                <div className="goal-heading">
                  <strong>{goal.skill}</strong>
                  {progress.complete && <span className="goal-reached">Goal reached</span>}
                </div>
                <p>{Math.min(progress.completed, goal.target)} of {goal.target} sessions</p>
                <div
                  className="goal-progress"
                  role="progressbar"
                  aria-label={`${goal.skill} goal progress`}
                  aria-valuenow={Math.min(progress.completed, goal.target)}
                  aria-valuemin="0"
                  aria-valuemax={goal.target}
                >
                  <span style={{ width: `${Math.min(100, (progress.completed / goal.target) * 100)}%` }} />
                </div>
                <button className="btn ghost small" type="button" aria-label={`Remove ${goal.skill} goal`} onClick={() => onRemoveGoal(goal.id)}>Remove</button>
              </li>
            );
          })}
        </ul>
      ) : <p className="muted">Add a goal to keep your learning on track.</p>}

      <form className="goal-form" onSubmit={addGoal}>
        <label className="field">
          <span>Skill</span>
          <select aria-label="Goal skill" value={selectedSkill} onChange={e => setSkillChoice(e.target.value)} required>
            {profile?.wants?.map(skill => <option key={skill} value={skill}>{skill}</option>)}
            <option value={CUSTOM_SKILL}>Other (enter a skill)</option>
          </select>
        </label>
        {selectedSkill === CUSTOM_SKILL && (
          <label className="field">
            <span>Custom skill</span>
            <input aria-label="Custom skill" maxLength={60} value={customSkill} onChange={e => setCustomSkill(e.target.value)} required />
          </label>
        )}
        <label className="field">
          <span>Sessions to complete</span>
          <select aria-label="Goal target" value={target} onChange={e => setTarget(e.target.value)}>
            {[1, 2, 3, 4, 5].map(count => <option key={count} value={count}>{count} {count === 1 ? 'session' : 'sessions'}</option>)}
          </select>
        </label>
        <button className="btn primary small" type="submit">Add goal</button>
      </form>
    </section>
  );
}

function StreakCard({ requests, now }) {
  const streak = computeStreak(requests, now);
  const doneWeeks = new Set(
    requests.filter(request => request.status === 'done')
      .map(request => weekStart(request.doneAt ?? request.ts).getTime())
  );
  const currentWeek = weekStart(now);
  const recentWeeks = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(currentWeek);
    date.setDate(date.getDate() - (5 - index) * 7);
    return { date, active: doneWeeks.has(date.getTime()) };
  });

  return (
    <section className="card streak-card" aria-labelledby="streakTitle">
      <h3 id="streakTitle">Weekly streak</h3>
      <div className="streak-stats">
        <p><strong>{streak.current}</strong><span>week{streak.current === 1 ? '' : 's'} current</span></p>
        <p><strong>{streak.best}</strong><span>week{streak.best === 1 ? '' : 's'} best</span></p>
      </div>
      <p className="streak-message">
        {streak.thisWeekDone ? "You're on track this week" : streak.current ? 'Complete a session this week to keep your streak alive' : 'Complete a session this week to start a streak'}
      </p>
      <ol className="streak-weeks" aria-label="Activity for the last six weeks">
        {recentWeeks.map(({ date, active }) => (
          <li key={date.getTime()}>
            <span className={active ? 'streak-dot active' : 'streak-dot'} aria-hidden="true" />
            <span className="sr-only">
              Week of {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}: {active ? 'session completed' : 'no session'}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

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

export default function Swaps({ profile, requests, goals = [], onAdvance, onCancel, onSchedule, onSaveReview, onAddGoal, onRemoveGoal }) {
  const pts = points(requests);
  const lvl = levelInfo(pts);
  const badges = badgeList(profile, requests, goals);
  const toast = useToast();
  const completedGoals = useRef(new Set(goals.filter(goal => goalProgress(goal, requests).complete).map(goal => goal.id)));

  useEffect(() => {
    const current = new Set();
    goals.forEach(goal => {
      if (!goalProgress(goal, requests).complete) return;
      current.add(goal.id);
      if (!completedGoals.current.has(goal.id)) toast(`${goal.skill} goal reached!`);
    });
    completedGoals.current = current;
  }, [goals, requests, toast]);

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

          <div className="swaps-requests">
            <div className="swap-progress-cards">
              <GoalsCard profile={profile} goals={goals} requests={requests} onAddGoal={onAddGoal} onRemoveGoal={onRemoveGoal} />
              <StreakCard requests={requests} now={Date.now()} />
            </div>
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
