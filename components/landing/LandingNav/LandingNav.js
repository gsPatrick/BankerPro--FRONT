'use client';

import { useEffect, useRef, useState } from 'react';
import BrandMark from '@/components/BrandMark/BrandMark';
import styles from './LandingNav.module.css';

const LINKS = [
  { label: 'Produto', href: '#produto' },
  { label: 'Como funciona', href: '#como-funciona' },
  { label: 'Planos', href: '#planos' },
  { label: 'FAQ', href: '#faq' },
];

export default function LandingNav({ onLogin, onRegister }) {
  const headerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [onLight, setOnLight] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const header = headerRef.current;
    const footer = document.querySelector('[data-landing-footer]');
    if (!header || !footer) return undefined;

    const update = () => {
      const hr = header.getBoundingClientRect();
      const fr = footer.getBoundingClientRect();
      const overlaps = hr.bottom > fr.top + 8 && hr.top < fr.bottom;
      setOnLight(overlaps);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header
      ref={headerRef}
      className={[
        styles.header,
        scrolled ? styles.scrolled : '',
        scrolled ? styles.expanded : '',
        onLight ? styles.onLight : '',
        open ? styles.menuOpen : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.inner}>
        <a className={styles.logo} href="#top" aria-label="Closer.IA">
          <BrandMark className={styles.logoMark} />
          <span className={styles.logoText}>Closer.IA</span>
        </a>

        <nav className={styles.nav} aria-label="Principal">
          <ul className={styles.menu}>
            {LINKS.map((link) => (
              <li key={link.label}>
                <a className={styles.menuItem} href={link.href}>
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <button type="button" className={styles.cta} onClick={onLogin}>
                Entrar
              </button>
            </li>
          </ul>

          <button
            type="button"
            className={[styles.burger, open ? styles.burgerOpen : '']
              .filter(Boolean)
              .join(' ')}
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <span />
            <span />
          </button>
        </nav>
      </div>

      <div
        className={[styles.popup, open ? styles.popupOpen : '']
          .filter(Boolean)
          .join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        <div className={styles.popupInner}>
          {LINKS.map((link) => (
            <a
              key={link.label}
              className={styles.popupItem}
              href={link.href}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <button
            type="button"
            className={styles.popupCta}
            onClick={() => {
              setOpen(false);
              onLogin?.();
            }}
          >
            Entrar
          </button>
          <button
            type="button"
            className={styles.popupItem}
            onClick={() => {
              setOpen(false);
              onRegister?.();
            }}
            style={{
              fontSize: 'clamp(22px, 6vw, 28px)',
              marginTop: 8,
              opacity: 0.65,
            }}
          >
            Criar conta
          </button>
        </div>
      </div>
    </header>
  );
}
