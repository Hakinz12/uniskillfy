import { useCallback, useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { useToast } from '../components/ui.jsx';

function isStandalone() {
  return Boolean(navigator.standalone) || window.matchMedia?.('(display-mode: standalone)').matches === true;
}

function isIosSafari() {
  const userAgent = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && navigator.maxTouchPoints > 1);
  return ios && /Safari/.test(userAgent) && !/(CriOS|FxiOS|EdgiOS|OPiOS)/.test(userAgent);
}

export function usePwa() {
  const deferredPrompt = useRef(null);
  const updateServiceWorker = useRef(null);
  const toast = useToast();
  const [standalone, setStandalone] = useState(isStandalone);
  const [canInstall, setCanInstall] = useState(false);
  const [showIosHint, setShowIosHint] = useState(() => isIosSafari() && !isStandalone());
  const [offline, setOffline] = useState(() => navigator.onLine === false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const displayMode = window.matchMedia?.('(display-mode: standalone)');
    const updateDisplayMode = event => setStandalone(Boolean(navigator.standalone) || event.matches);
    const onBeforeInstallPrompt = event => {
      event.preventDefault();
      deferredPrompt.current = event;
      setCanInstall(true);
      setShowIosHint(false);
    };
    const onAppInstalled = () => {
      deferredPrompt.current = null;
      setCanInstall(false);
      setShowIosHint(false);
      setStandalone(true);
    };
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);

    if (displayMode?.addEventListener) displayMode.addEventListener('change', updateDisplayMode);
    else displayMode?.addListener?.(updateDisplayMode);
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    if (import.meta.env.PROD) {
      updateServiceWorker.current = registerSW({
        onNeedRefresh: () => setUpdateAvailable(true),
        onRegisterError: error => console.error('Service worker registration failed:', error)
      });
    }

    return () => {
      if (displayMode?.removeEventListener) displayMode.removeEventListener('change', updateDisplayMode);
      else displayMode?.removeListener?.(updateDisplayMode);
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const install = useCallback(async () => {
    const prompt = deferredPrompt.current;
    if (!prompt) return;
    deferredPrompt.current = null;
    setCanInstall(false);
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch (error) {
      console.error('App installation prompt failed:', error);
      toast('Unable to open the install prompt. Please try again.');
    }
  }, [toast]);

  const dismissIosHint = useCallback(() => setShowIosHint(false), []);
  const reload = useCallback(async () => {
    if (updateServiceWorker.current) await updateServiceWorker.current(true);
  }, []);

  return {
    showInstall: canInstall && !standalone,
    showIosHint: showIosHint && !standalone && !canInstall,
    dismissIosHint,
    install,
    offline,
    updateAvailable,
    reload
  };
}
