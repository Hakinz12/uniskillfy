import { useState } from 'react';
import { clean, norm } from '../data.js';
import { useToast } from './ui.jsx';

const MAX = 8;

/** Controlled skill-chips input. `value` is a string[]; `onChange` gets the new array. */
export default function ChipInput({ labelId, kind, value, onChange, suggestions = [], inputRef, invalid, describedBy }) {
  const [text, setText] = useState('');
  const toast = useToast();

  function add(raw) {
    const s = clean(raw);
    if (!s || value.some(x => norm(x) === norm(s))) return;
    if (value.length >= MAX) return toast(`Max ${MAX} skills per list`);
    onChange([...value, s]);
  }
  function commit() {
    if (text.trim()) add(text);
    setText('');
  }
  const remove = i => onChange(value.filter((_, k) => k !== i));

  return (
    <>
      <div className={'chips-input' + (invalid ? ' invalid' : '')} onClick={e => e.currentTarget.querySelector('input').focus()}>
        {value.map((s, i) => (
          <span key={s} className={`chip ${kind}`}>
            {s}
            <button type="button" aria-label={`Remove ${s}`} onClick={e => { e.stopPropagation(); remove(i); }}>×</button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          maxLength={30}
          placeholder="Add a skill…"
          list="skillList"
          aria-labelledby={labelId}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          value={text}
          onChange={e => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit(); }
            else if (e.key === 'Backspace' && !text && value.length) remove(value.length - 1);
          }}
        />
      </div>
      <div className="suggest">
        {suggestions.filter(s => !value.some(h => norm(h) === norm(s))).slice(0, 6).map(s => (
          <button key={s} type="button" onClick={() => add(s)}>+ {s}</button>
        ))}
      </div>
    </>
  );
}
