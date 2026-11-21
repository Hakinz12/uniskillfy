import { useCallback, useEffect, useRef, useState } from 'react';

const STORE = 'campus-skill-swap.react.v1';
const THEME = 'campus-skill-swap.theme';
export const TOUR_SEEN_KEY = 'campus-skill-swap.tourSeen.v1';
const LEGACY_TOUR_SEEN_KEY = 'tourSeen';
const EMPTY = { profile: null, requests: [], goals: [] };
let tourSeenInMemory = false;

function saveTourSeen() {
  try {
    localStorage.setItem(TOUR_SEEN_KEY, 'true');
    return;
  } catch { /* try session storage when persistent storage is blocked */ }
  try {
    sessionStorage.setItem(TOUR_SEEN_KEY, 'true');
    return;
  } catch { /* retain the seen state for this page load */ }
  tourSeenInMemory = true;
}

function isTourSeen() {
  if (tourSeenInMemory) return true;
  try {
    if (localStorage.getItem(TOUR_SEEN_KEY) !== null) return true;
  } catch { /* try the session fallback */ }
  try {
    if (sessionStorage.getItem(TOUR_SEEN_KEY) !== null) return true;
  } catch { /* storage may be blocked */ }

  try {
    if (localStorage.getItem(LEGACY_TOUR_SEEN_KEY) !== null) {
      saveTourSeen();
      return true;
    }
    const oldState = JSON.parse(localStorage.getItem(STORE));
    if (oldState?.tourSeen === true || oldState?.tourSeen === 'true') {
      saveTourSeen();
      return true;
    }
  } catch { /* ignore inaccessible or corrupt legacy data */ }
  return false;
}

function autoStartIsBlocked() {
  return Boolean(document.querySelector('.error-screen[role="alert"], dialog[open], [role="dialog"]'));
}

function checkStorage() {
  try {
    const key = `${STORE}.availability-check`;
    localStorage.setItem(key, '1');
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function load() {
  try {
    const d = JSON.parse(localStorage.getItem(STORE));
    if (d && typeof d === 'object') {
      if (d.tourSeen === true || d.tourSeen === 'true') saveTourSeen();
      return {
        profile: d.profile || null,
        requests: Array.isArray(d.requests) ? d.requests : [],
        goals: Array.isArray(d.goals) ? d.goals : []
      };
    }
  } catch { /* corrupt or blocked storage starts with defaults */ }
  return EMPTY;
}

/** Profile + swap requests, persisted to localStorage. */
export function useAppState() {
  const [storageAvailable] = useState(checkStorage);
  const [state, setState] = useState(load);

  useEffect(() => {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch { /* private mode */ }
  }, [state]);

  const saveProfile = useCallback(profile => setState(s => ({ ...s, profile })), []);
  const addRequest = useCallback(req => setState(s => ({ ...s, requests: [req, ...s.requests] })), []);
  const advance = useCallback(id => setState(s => ({
    ...s,
    requests: s.requests.map(r => {
      if (r.id !== id) return r;
      if (r.status === 'pending') return { ...r, status: 'accepted' };
      if (r.status === 'accepted') return { ...r, status: 'done', doneAt: Date.now() };
      return r;
    })
  })), []);
  const schedule = useCallback((id, session) => setState(s => ({
    ...s,
    requests: s.requests.map(r => (r.id === id ? { ...r, session } : r))
  })), []);
  const saveReview = useCallback((id, review) => setState(s => ({
    ...s,
    requests: s.requests.map(r => (r.id === id ? { ...r, review } : r))
  })), []);
  const addGoal = useCallback(goal => setState(s => ({ ...s, goals: [...s.goals, goal] })), []);
  const removeGoal = useCallback(id => setState(s => ({ ...s, goals: s.goals.filter(goal => goal.id !== id) })), []);
  const updateGoal = useCallback((id, updates) => setState(s => ({
    ...s,
    goals: s.goals.map(goal => (goal.id === id ? { ...goal, ...updates } : goal))
  })), []);
  const cancel = useCallback(id => setState(s => ({ ...s, requests: s.requests.filter(r => r.id !== id) })), []);
  const reset = useCallback(() => setState(EMPTY), []);

  return { ...state, storageAvailable, saveProfile, addRequest, advance, schedule, saveReview, addGoal, removeGoal, updateGoal, cancel, reset };
}

export function useTour(autoStart = true) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const openRef = useRef(false);
  const autoStartAttempted = useRef(false);

  const show = useCallback(() => {
    openRef.current = true;
    setStep(0);
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!autoStart || autoStartAttempted.current) return;
    autoStartAttempted.current = true;
    if (isTourSeen() || autoStartIsBlocked()) return;
    saveTourSeen();
    show();
  }, [autoStart, show]);

  const start = useCallback(() => {
    if (!openRef.current) show();
  }, [show]);
  const finish = useCallback(() => {
    openRef.current = false;
    setOpen(false);
  }, []);

  return { open, step, setStep, start, finish };
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
