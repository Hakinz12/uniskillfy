import { useCallback, useEffect, useState } from 'react';

const STORE = 'campus-skill-swap.react.v1';
const THEME = 'campus-skill-swap.theme';
const EMPTY = { profile: null, requests: [] };

function load() {
  try {
    const d = JSON.parse(localStorage.getItem(STORE));
    if (d && typeof d === 'object') {
      return { profile: d.profile || null, requests: Array.isArray(d.requests) ? d.requests : [] };
    }
  } catch { /* ignore corrupt or blocked storage */ }
  return EMPTY;
}

/** Profile + swap requests, persisted to localStorage. */
export function useAppState() {
  const [state, setState] = useState(load);

  useEffect(() => {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch { /* private mode */ }
  }, [state]);

  const saveProfile = useCallback(profile => setState(s => ({ ...s, profile })), []);
  const addRequest = useCallback(req => setState(s => ({ ...s, requests: [req, ...s.requests] })), []);
  const advance = useCallback(id => setState(s => ({
    ...s,
    requests: s.requests.map(r => (r.id === id ? { ...r, status: r.status === 'pending' ? 'accepted' : 'done' } : r))
  })), []);
  const schedule = useCallback((id, session) => setState(s => ({
    ...s,
    requests: s.requests.map(r => (r.id === id ? { ...r, session } : r))
  })), []);
  const saveReview = useCallback((id, review) => setState(s => ({
    ...s,
    requests: s.requests.map(r => (r.id === id ? { ...r, review } : r))
  })), []);
  const cancel = useCallback(id => setState(s => ({ ...s, requests: s.requests.filter(r => r.id !== id) })), []);
  const reset = useCallback(() => setState(EMPTY), []);

  return { ...state, saveProfile, addRequest, advance, schedule, saveReview, cancel, reset };
}

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      const t = localStorage.getItem(THEME);
      if (t) return t;
    } catch { /* ignore */ }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(THEME, theme); } catch { /* ignore */ }
  }, [theme]);
  return [theme, () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))];
}

export function useCountUp(target) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setVal(target); return undefined; }
    let raf;
    const from = val, t0 = performance.now(), dur = 700;
    const step = t => {
      const k = Math.min(1, (t - t0) / dur);
      setVal(Math.round(from + (target - from) * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return val;
}
