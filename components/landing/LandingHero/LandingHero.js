'use client';

import { useEffect, useState } from 'react';
import styles from './LandingHero.module.css';

/**
 * Same structure as Integrated Biosciences HeroExperience:
 * - Void page around an inset rounded banner
 * - Photo + copy live ONLY inside that banner
 * - Load: clip-path opens the banner from the centre
 * - Scroll (scrollY > 8): banner snaps open to full-bleed
 */
export default function LandingHero({ onRegister }) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const onScroll = () => setExpanded(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <section className={styles.experience} id="top">
      <div className={styles.mediaBg}>
        <div className={`${styles.frame} ${expanded ? styles.expanded : ''}`}>
          <div className={styles.canvas} aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={styles.image}
              src="/pexels-vazhnik-7864382.jpg"
              alt=""
              draggable={false}
            />
            <div className={styles.veil} />
          </div>

          {/* Copy lives inside the banner so it never spills onto the void */}
          <div className={styles.content}>
            <div className={styles.copy}>
              <h1 className={styles.heading}>
                Treine fechamentos
                <br />
                de alto nível com IA.
              </h1>

              <div className={styles.bottom}>
                <p className={styles.text}>
                  Acelere performance em vendas e negociação com simulações, roteiros
                  e um copiloto que fala a língua do banco.
                </p>
                <button
                  type="button"
                  className={styles.cta}
                  onClick={onRegister}
                  aria-label="Começar agora"
                >
                  <span className={styles.label}>
                    <span>Começar agora</span>
                    <span className={styles.corner} aria-hidden="true">
                      <svg width="18" height="48" viewBox="0 0 18 48" fill="none">
                        <path
                          fill="currentColor"
                          d="M0 0h5.63c7.808 0 13.536 7.337 11.642 14.91l-6.09 24.359A11.527 11.527 0 0 1 0 48V0Z"
                        />
                      </svg>
                    </span>
                  </span>
                  <span className={styles.icon} aria-hidden="true">
                    <svg className={styles.blob} width="51" height="48" viewBox="0 0 51 48" fill="none">
                      <path
                        fill="currentColor"
                        d="M6.728 9.09A12 12 0 0 1 18.369 0H39c6.627 0 12 5.373 12 12v24c0 6.627-5.373 12-12 12H12.37C4.561 48-1.167 40.663.727 33.09l6-24Z"
                      />
                    </svg>
                    <svg className={styles.arrow} width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 12h13M13 6l6 6-6 6"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.scrollRun} aria-hidden="true" />
    </section>
  );
}
