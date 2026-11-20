import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { hue, initials } from '../data.js';

export function Avatar({ name }) {
  return <div className="avatar" style={{ '--h': hue(name) }} aria-hidden="true">{initials(name)}</div>;
}

export const SwapIcon = ({ size = 24, className }) => (
  <svg className={className} viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 8h14l-3.5-3.5M20 16H6l3.5 3.5" />
  </svg>
);

export const SearchIcon = ({ size = 18 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
  </svg>
);

/* ---------- toast ---------- */
const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState('');
  const [show, setShow] = useState(false);
  const timer = useRef();
  const toast = useCallback(m => {
    setMsg(m);
    setShow(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setShow(false), 2600);
  }, []);
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className={'toast' + (show ? ' show' : '')} role="status" aria-live="polite">{msg}</div>
    </ToastCtx.Provider>
  );
}
