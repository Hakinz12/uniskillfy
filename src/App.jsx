import { useState } from 'react';
import { Footer, Hero, HowItWorks, Nav } from './components/Layout.jsx';
import Match from './components/Match.jsx';
import Browse from './components/Browse.jsx';
import Swaps from './components/Swaps.jsx';
import RequestDialog from './components/RequestDialog.jsx';
import { ToastProvider, useToast } from './components/ui.jsx';
import { useAppState, useTheme } from './hooks/useAppState.js';
import { BASE_SWAPS, CATS, SEED, norm } from './data.js';

function Site() {
  const app = useAppState();
  const [, toggleTheme] = useTheme();
  const [target, setTarget] = useState(null);
  const toast = useToast();
  const { profile, requests } = app;

  const members = SEED.length + (profile ? 1 : 0);
  const skills = new Set([...SEED, ...(profile ? [profile] : [])].flatMap(c => c.teaches.map(norm))).size;
  const swaps = BASE_SWAPS + requests.filter(r => r.status === 'done').length;
  const openCount = requests.filter(r => r.status !== 'done').length;

  function openRequest(id) {
    if (!profile) {
      toast('Add your skills first so we know what you can offer.');
      document.getElementById('match')?.scrollIntoView?.({ behavior: 'smooth' });
      document.getElementById('fName')?.focus({ preventScroll: true });
      return;
    }
    setTarget(SEED.find(s => s.id === id) || null);
  }

  function send({ offer, learn, msg }) {
    const dup = requests.some(r => r.mid === target.id && r.offer === offer && r.learn === learn && r.status !== 'done');
    if (dup) return toast('You already have that swap open.');
    app.addRequest({
      id: Date.now().toString(36), mid: target.id, mname: target.name, mcollege: target.college,
      offer, learn, msg, status: 'pending', ts: Date.now()
    });
    toast(`Request sent to ${target.name.split(' ')[0]}! +10 pts`);
  }

  function advance(id) {
    const r = requests.find(x => x.id === id);
    if (!r) return;
    app.advance(id);
    toast(r.status === 'accepted' ? 'Session complete! +70 pts 🎉' : 'Nice. Time to lock in a slot. +20 pts');
  }

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <Nav openCount={openCount} onToggleTheme={toggleTheme} />
      <main id="main">
        <Hero members={members} skills={skills} swaps={swaps} />
        <HowItWorks />
        <Match profile={profile} onSave={app.saveProfile} onReset={app.reset} onRequest={openRequest} />
        <Browse profile={profile} onRequest={openRequest} />
        <Swaps profile={profile} requests={requests} onAdvance={advance} onCancel={app.cancel} onSchedule={app.schedule} />
      </main>
      <Footer />
      <datalist id="skillList">
        {Object.values(CATS).flat().map(s => <option key={s} value={s} />)}
      </datalist>
      <RequestDialog target={target} profile={profile} onSend={send} onClose={() => setTarget(null)} />
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Site />
    </ToastProvider>
  );
}
