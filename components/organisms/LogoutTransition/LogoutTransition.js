'use client';

import BrandMark from '@/components/BrandMark/BrandMark';
import styles from './LogoutTransition.module.css';

/**
 * Organism: LogoutTransition
 * Full-screen farewell while the session is cleared.
 */
export default function LogoutTransition({ exiting = false }) {
  return (
    <div
      className={[styles.overlay, exiting ? styles.exiting : ''].filter(Boolean).join(' ')}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className={styles.stage}>
        <BrandMark className={styles.mark} />
        <h2 className={styles.brand}>Closer.IA</h2>
        <p className={styles.message}>Encerrando sua sessão…</p>
        <div className={styles.rail} aria-hidden="true">
          <span className={styles.railFill} />
        </div>
      </div>
    </div>
  );
}
