import { Avatar, SwapIcon } from './ui.jsx';
import { badgeList, levelInfo, points } from '../data.js';

function Request({ r, onAdvance, onCancel }) {
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
      <div className="req-actions">
        <span className="when">Sent {when}</span>
        {r.status === 'pending' && <button className="btn ghost small" onClick={() => onAdvance(r.id)}>They accepted</button>}
        {r.status === 'accepted' && <button className="btn primary small" onClick={() => onAdvance(r.id)}>Mark session done</button>}
        {r.status !== 'done' && <button className="btn ghost small" onClick={() => onCancel(r.id)}>Cancel</button>}
      </div>
    </li>
  );
}

export default function Swaps({ profile, requests, onAdvance, onCancel }) {
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
              {requests.map(r => <Request key={r.id} r={r} onAdvance={onAdvance} onCancel={onCancel} />)}
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
