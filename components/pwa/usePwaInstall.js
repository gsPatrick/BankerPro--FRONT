'use client';

import { useCallback, useEffect, useState } from 'react';

const DISMISS_KEY = 'closer-pwa-install-dismissed';
const DISMISS_MS = 1000 * 60 * 60 * 24 * 30; // 30 dias

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

/** Só iPhone / Android phone — não desktop nem tablet */
function isMobilePhone() {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';

  if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) return false;
  // iPadOS reporta como Mac + touch
  if (ua.includes('Mac') && 'ontouchend' in document && !/iPhone|iPod/.test(ua)) {
    return false;
  }
  if (/iPhone|iPod/i.test(ua)) return true;
  if (/Android/i.test(ua) && /Mobile/i.test(ua)) return true;
  if (/webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return true;
  return false;
}

function isIosPhone() {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPod/i.test(navigator.userAgent || '');
}

function readDismissed() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return true;
    return Date.now() - ts < DISMISS_MS;
  } catch {
    return false;
  }
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [isPhone, setIsPhone] = useState(false);
  const [canPrompt, setCanPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    setIos(isIosPhone());
    setIsPhone(isMobilePhone());
    setDismissed(readDismissed());

    const onBeforeInstall = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setCanPrompt(true);
    };

    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      setCanPrompt(false);
      try {
        localStorage.removeItem(DISMISS_KEY);
      } catch {
        /* ignore */
      }
      setDismissed(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return { outcome: 'unavailable' };
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setCanPrompt(false);
    return choice;
  }, [deferredPrompt]);

  const dismissBanner = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  }, []);

  return {
    installed,
    ios,
    isPhone,
    canPrompt,
    dismissed,
    promptInstall,
    dismissBanner,
    isInstallable: isPhone && !installed && (canPrompt || ios),
  };
}
