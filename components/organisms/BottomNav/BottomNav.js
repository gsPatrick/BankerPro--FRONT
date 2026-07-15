'use client';

import styles from './BottomNav.module.css';

/**
 * Organism: BottomNav
 * Native application bottom bar navigation
 * Supports a raised center action (item.center === true)
 */
export default function BottomNav({ items = [], activeId, onChange, className = '' }) {
  return (
    <nav
      className={[styles.bottomNav, className].filter(Boolean).join(' ')}
      aria-label="Navegação inferior do aplicativo"
    >
      <div className={styles.container}>
        {items.map((item) => {
          const isActive = item.id === activeId;
          const isCenter = Boolean(item.center);

          return (
            <button
              key={item.id}
              className={[
                styles.item,
                isActive ? styles.active : '',
                isCenter ? styles.centerItem : '',
              ].filter(Boolean).join(' ')}
              onClick={() => onChange && onChange(item.id)}
              aria-selected={isActive}
              aria-label={item.label}
              role="tab"
              data-tour={`tour-nav-${item.id}`}
            >
              <span className={[styles.icon, isCenter ? styles.centerIcon : ''].filter(Boolean).join(' ')}>
                {item.icon}
              </span>
              {!isCenter && <span className={styles.label}>{item.label}</span>}
              {isActive && !isCenter && <span className={styles.indicator} aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
