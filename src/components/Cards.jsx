import { Avatar } from './ui.jsx';
import { ratingInfo } from '../data.js';

const LABEL = { mutual: 'Mutual swap', learn: 'You can learn', teach: 'You can teach' };

function Rating({ member, requests }) {
  const rating = ratingInfo(member, requests);
  if (!rating) return null;
  return (
    <span className="rating" aria-label={`Rated ${rating.average.toFixed(1)} out of 5 from ${rating.count} reviews`}>
      <span aria-hidden="true">★</span> {rating.average.toFixed(1)} ({rating.count})
    </span>
  );
}

export function MatchCard({ match, onRequest, requests }) {
  const { c, theyTeach, theyWant, score, kind } = match;
  return (
    <article className="m-card">
      <div className="m-top">
        <Avatar name={c.name} />
        <div className="m-id"><strong>{c.name}</strong><span>{c.college}</span></div>
        <div className="score" style={{ '--p': score }} aria-label={`${score} percent match`}><b>{score}%</b></div>
      </div>
      <Rating member={c} requests={requests} />
      <div><span className={`tag ${kind}`}>{LABEL[kind]}</span></div>
      <ul className="why">
        {theyTeach.map(s => <li key={'t' + s}>Teaches <b>{s}</b>, which you want</li>)}
        {theyWant.map(s => <li key={'w' + s}>Wants <b>{s}</b>, which you teach</li>)}
      </ul>
      <div className="skills" aria-label="Teaches">
        {c.teaches.map(s => <span key={s} className={'skill' + (theyTeach.includes(s) ? ' hit' : '')}>{s}</span>)}
      </div>
      <div className="meta"><span>{c.when}</span><span>{c.mode}</span></div>
      <div className="m-actions">
        <button className="btn primary small" onClick={() => onRequest(c.id)}>Request swap</button>
      </div>
    </article>
  );
}

export function CommunityCard({ member, view, onRequest, requests }) {
  const teach = view === 'teach';
  const shown = teach ? member.teaches : member.wants;
  const other = teach ? member.wants : member.teaches;
  return (
    <article className="m-card">
      <div className="m-top">
        <Avatar name={member.name} />
        <div className="m-id">
          <strong>{member.name}{member.isMe && <> <span className="tag mutual">You</span></>}</strong>
          <span>{member.college}</span>
        </div>
        <Rating member={member} requests={requests} />
      </div>
      {member.bio && <p className="bio">“{member.bio}”</p>}
      <div>
        <small className="muted">{teach ? 'Can teach' : 'Wants to learn'}</small>
        <div className="skills">{shown.map(s => <span key={s} className="skill">{s}</span>)}</div>
      </div>
      <p className="muted" style={{ fontSize: '.9rem' }}>{teach ? 'Wants' : 'Can teach'}: {other.join(', ') || '—'}</p>
      <div className="meta"><span>{member.when}</span><span>{member.mode}</span></div>
      {!member.isMe && (
        <div className="m-actions">
          <button className="btn ghost small" onClick={() => onRequest(member.id)}>Request swap</button>
        </div>
      )}
    </article>
  );
}
