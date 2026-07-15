'use client';

import { useEffect, useRef, useState } from 'react';
import BrandMark from '@/components/BrandMark/BrandMark';
import { usePwaInstall } from './usePwaInstall';
import styles from './InstallPrompt.module.css';

export default function InstallPrompt() {
  const {
    installed,
    ios,
    isPhone,
    canPrompt,
    dismissed,
    promptInstall,
    dismissBanner,
  } = usePwaInstall();
  const [open, setOpen] = useState(false);
  const [iosGuide, setIosGuide] = useState(false);
  const shownOnce = useRef(false);

  useEffect(() => {
    if (!isPhone || installed || dismissed || shownOnce.current) return undefined;
    if (!(canPrompt || ios)) return undefined;

    const timer = window.setTimeout(() => {
      if (shownOnce.current) return;
      if (readStillDismissed()) return;
      shownOnce.current = true;
      setOpen(true);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [isPhone, installed, dismissed, canPrompt, ios]);

  if (!isPhone || !open || installed || dismissed) return null;

  const close = () => {
    shownOnce.current = true;
    setOpen(false);
    setIosGuide(false);
    dismissBanner();
  };

  const onInstall = async () => {
    if (ios) {
      setIosGuide(true);
      return;
    }
    const result = await promptInstall();
    if (result?.outcome === 'accepted') {
      setOpen(false);
    }
  };

  return (
    <div className={styles.root} role="dialog" aria-labelledby="pwa-install-title">
      <div className={styles.sheet}>
        <div className={styles.brandRow}>
          <BrandMark className={styles.icon} />
          <div>
            <p className={styles.eyebrow}>Instalar app</p>
            <h2 id="pwa-install-title" className={styles.title}>
              Closer.IA na tela inicial
            </h2>
          </div>
        </div>

        {!iosGuide ? (
          <>
            <p className={styles.text}>
              Abra como app nativo: tela cheia, ícone próprio e acesso rápido —
              sem App Store.
            </p>
            <div className={styles.actions}>
              <button type="button" className={styles.secondary} onClick={close}>
                Agora não
              </button>
              <button type="button" className={styles.primary} onClick={onInstall}>
                {ios ? 'Como instalar' : 'Instalar'}
              </button>
            </div>
          </>
        ) : (
          <>
            <ol className={styles.steps}>
              <li>
                Toque em <strong>Compartilhar</strong> na barra do Safari.
              </li>
              <li>
                Role e toque em <strong>Adicionar à Tela de Início</strong>.
              </li>
              <li>
                Confirme em <strong>Adicionar</strong>.
              </li>
            </ol>
            <div className={styles.actions}>
              <button type="button" className={styles.primary} onClick={close}>
                Entendi
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function readStillDismissed() {
  try {
    const raw = localStorage.getItem('closer-pwa-install-dismissed');
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return true;
    return Date.now() - ts < 1000 * 60 * 60 * 24 * 30;
  } catch {
    return false;
  }
}
