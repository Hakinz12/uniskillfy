import { useEffect, useRef, useState } from 'react';
import { same } from '../data.js';

const preferFirst = (arr, prefer) =>
  [...arr].sort((a, b) => (prefer.some(x => same(x, b)) ? 1 : 0) - (prefer.some(x => same(x, a)) ? 1 : 0));

/** Native <dialog> that opens whenever `target` (a student) is set. */
export default function RequestDialog({ target, profile, onSend, onClose }) {
  const ref = useRef(null);
  const [offer, setOffer] = useState('');
  const [learn, setLearn] = useState('');
  const [msg, setMsg] = useState('');

  const offers = target && profile ? preferFirst(profile.teaches, target.wants) : [];
  const learns = target && profile ? preferFirst(target.teaches, profile.wants) : [];

  useEffect(() => {
    if (!target || !profile) return;
    setOffer(preferFirst(profile.teaches, target.wants)[0]);
    setLearn(preferFirst(target.teaches, profile.wants)[0]);
    setMsg(`Hey ${target.name.split(' ')[0]}! I'd love to swap skills. Are you free ${target.when.toLowerCase()}?`);
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, [target, profile]);

  function send(e) {
    e.preventDefault();
    onSend({ offer, learn, msg: msg.trim() });
    ref.current.close();
  }

  return (
    <dialog ref={ref} aria-labelledby="dlgTitle" onClose={onClose} onClick={e => { if (e.target === ref.current) ref.current.close(); }}>
      <form className="dlg-body" onSubmit={send}>
        <h3 id="dlgTitle">Request a swap</h3>
        {target && <p className="dlg-sub">{target.name} · {target.college} · free {target.when.toLowerCase()}</p>}
        <label className="field">
          <span>You teach them</span>
          <select value={offer} onChange={e => setOffer(e.target.value)}>{offers.map(o => <option key={o}>{o}</option>)}</select>
        </label>
        <label className="field">
          <span>They teach you</span>
          <select value={learn} onChange={e => setLearn(e.target.value)}>{learns.map(o => <option key={o}>{o}</option>)}</select>
        </label>
        <label className="field">
          <span>Message</span>
          <textarea rows={3} maxLength={240} value={msg} onChange={e => setMsg(e.target.value)} placeholder="Hey! Want to do a 45 minute swap this week?" />
        </label>
        <div className="form-actions">
          <button className="btn primary" type="submit">Send request</button>
          <button className="btn ghost" type="button" onClick={() => ref.current.close()}>Cancel</button>
        </div>
      </form>
    </dialog>
  );
}
