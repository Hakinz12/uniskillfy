import { useState } from 'react';
import { Footer, Hero, HowItWorks, Nav } from './components/Layout.jsx';
import Match from './components/Match.jsx';
import Browse from './components/Browse.jsx';
import Swaps from './components/Swaps.jsx';
import RequestDialog from './components/RequestDialog.jsx';
import Tour from './components/Tour.jsx';
import NotFound, { isHomePathname } from './components/NotFound.jsx';
import { ToastProvider, useToast } from './components/ui.jsx';
import { useAppState, useTheme, useTour } from './hooks/useAppState.js';
import { usePwa } from './hooks/usePwa.js';
import { BASE_SWAPS, CATS, SEED, norm } from './data.js';

function Site({ autoStartTour }) {
  const app = useAppState();
  const [, toggleTheme] = useTheme();
  const tour = useTour(autoStartTour);
  const pwa = usePwa();
  const [target, setTarget] = useState(null);
  const [showStorageWarning, setShowStorageWarning] = useState(!app.storageAvailable);
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
      {showStorageWarning && (
        <div className="storage-warning" role="alert">
          <span>Your progress can't be saved in this browser mode.</span>
          <button type="button" className="storage-dismiss" aria-label="Dismiss storage warning" onClick={() => setShowStorageWarning(false)}>×</button>
        </div>
      )}
      {pwa.offline && <div className="offline-banner" role="status">You're offline. Your Uniskillfy swaps are saved on this device.</div>}
      <Nav
        openCount={openCount}
        onToggleTheme={toggleTheme}
        onStartTour={tour.start}
        showInstall={pwa.showInstall}
        onInstall={pwa.install}
        showIosHint={pwa.showIosHint}
        onDismissIosHint={pwa.dismissIosHint}
      />
      {pwa.updateAvailable && (
        <div className="update-banner" role="status">
          <span>A new version is available</span>
          <button className="btn primary small" type="button" onClick={pwa.reload}>Reload</button>
        </div>
      )}
      <main id="main">
        <Hero members={members} skills={skills} swaps={swaps} />
        <HowItWorks />
        <Match profile={profile} requests={requests} onSave={app.saveProfile} onReset={app.reset} onRequest={openRequest} />
        <Browse profile={profile} requests={requests} onRequest={openRequest} />
        <Swaps
          profile={profile}
          requests={requests}
          goals={app.goals}
          onAdvance={advance}
          onCancel={app.cancel}
          onSchedule={app.schedule}
          onSaveReview={app.saveReview}
          onAddGoal={app.addGoal}
          onRemoveGoal={app.removeGoal}
        />
      </main>
      <Footer onStartTour={tour.start} />
      <datalist id="skillList">
        {Object.values(CATS).flat().map(s => <option key={s} value={s} />)}
      </datalist>
      <RequestDialog target={target} profile={profile} onSend={send} onClose={() => setTarget(null)} />
      <Tour open={tour.open} step={tour.step} onStepChange={tour.setStep} onClose={tour.finish} />
    </>
  );
}

export default function App({ autoStartTour = import.meta.env.MODE !== 'test' }) {
  if (!isHomePathname(window.location.pathname)) return <NotFound />;
  return (
    <ToastProvider>
      <Site autoStartTour={autoStartTour} />
    </ToastProvider>
  );
}
