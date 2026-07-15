'use client';

import styles from './NavBar.module.css';

/**
 * Organism: NavBar
 * Top bar layout with back button, page title and right action slots
 */
export default function NavBar({
  title,
  subtitle,
  onBack,
  actionRight,
  sticky = true,
  wide = false,
  className = '',
}) {
  return (
    <header className={[styles.header, sticky ? styles.sticky : '', className].filter(Boolean).join(' ')}>
      <div className={[styles.container, wide ? styles.containerWide : ''].filter(Boolean).join(' ')}>
        <div className={styles.left}>
          {onBack && (
            <button className={styles.backBtn} onClick={onBack} aria-label="Voltar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
          )}
          <div className={styles.titleArea}>
            <h1 className={styles.title}>{title}</h1>
            {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
          </div>
        </div>
        {actionRight && <div className={styles.right}>{actionRight}</div>}
      </div>
    </header>
  );
}
