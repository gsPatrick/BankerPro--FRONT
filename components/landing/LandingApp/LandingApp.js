'use client';

import { useState } from 'react';
import BrandMark from '@/components/BrandMark/BrandMark';
import { usePwaInstall } from '@/components/pwa/usePwaInstall';
import styles from './LandingApp.module.css';

export default function LandingApp() {
  const { installed, ios, canPrompt, promptInstall, isInstallable } =
    usePwaInstall();
  const [iosGuide, setIosGuide] = useState(false);
  const [busy, setBusy] = useState(false);

  const onInstallClick = async () => {
    if (installed) return;

    if (ios) {
      setIosGuide(true);
      return;
    }

    if (!canPrompt) {
      setIosGuide(true);
      return;
    }

    setBusy(true);
    try {
      await promptInstall();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={styles.section} id="app">
      <div className={styles.inner}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Aplicativo</p>
          <h2 className={styles.title}>Closer.IA no bolso.</h2>
          <p className={styles.text}>
            Em breve nas lojas. Enquanto isso, instale o PWA na tela inicial —
            funciona como app nativo no celular e no desktop.
          </p>
        </div>

        <div className={styles.grid}>
          <article className={styles.card}>
            <div className={styles.logoSlot}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={styles.logoImg}
                src="/landing/apple-logo.png"
                alt="Apple"
              />
            </div>
            <div className={styles.cardMeta}>
              <h3 className={styles.cardTitle}>iPhone</h3>
              <p className={styles.cardBody}>App Store</p>
              <span className={styles.badgeSoon}>Em breve</span>
            </div>
          </article>

          <article className={styles.card}>
            <div className={styles.logoSlot}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={styles.logoImg}
                src="/landing/android-logo.png"
                alt="Android"
              />
            </div>
            <div className={styles.cardMeta}>
              <h3 className={styles.cardTitle}>Android</h3>
              <p className={styles.cardBody}>Google Play</p>
              <span className={styles.badgeSoon}>Em breve</span>
            </div>
          </article>

          <article className={`${styles.card} ${styles.cardReady}`}>
            <div className={`${styles.logoSlot} ${styles.logoSlotReady}`}>
              <BrandMark className={styles.pwaMark} />
            </div>
            <div className={styles.cardMeta}>
              <h3 className={styles.cardTitle}>Instalar agora</h3>
              <p className={styles.cardBody}>
                {installed
                  ? 'Já está na tela inicial'
                  : 'Atalho nativo no celular ou desktop'}
              </p>

              {installed ? (
                <span className={styles.badgeReady}>Instalado</span>
              ) : (
                <button
                  type="button"
                  className={styles.installBtn}
                  onClick={onInstallClick}
                  disabled={busy}
                >
                  {busy
                    ? 'Abrindo…'
                    : ios || !canPrompt
                      ? 'Ver como instalar'
                      : 'Instalar app'}
                </button>
              )}

              {iosGuide && !installed && (
                <ol className={styles.installSteps}>
                  {ios ? (
                    <>
                      <li>
                        Toque em <strong>Compartilhar</strong> no Safari
                      </li>
                      <li>
                        <strong>Adicionar à Tela de Início</strong>
                      </li>
                      <li>
                        Confirme em <strong>Adicionar</strong>
                      </li>
                    </>
                  ) : (
                    <>
                      <li>
                        No Chrome/Edge, abra o menu <strong>⋮</strong>
                      </li>
                      <li>
                        Toque em <strong>Instalar app</strong> ou{' '}
                        <strong>Adicionar à tela inicial</strong>
                      </li>
                      {isInstallable ? null : (
                        <li>
                          Se não aparecer, recarregue a página e tente de novo
                        </li>
                      )}
                    </>
                  )}
                </ol>
              )}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
