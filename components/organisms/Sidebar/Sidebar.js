'use client';

import Link from 'next/link';
import BrandMark from '@/components/BrandMark/BrandMark';
import styles from './Sidebar.module.css';

/**
 * Organism: Sidebar
 * Collapsible desktop navigation (icons + labels; supports admin dividers)
 */
export default function Sidebar({
  items = [],
  activeId,
  brand = 'Closer.IA',
  collapsed = false,
  onToggleCollapse,
}) {
  return (
    <aside
      className={[styles.sidebar, collapsed ? styles.collapsed : ''].filter(Boolean).join(' ')}
      aria-label="Navegação principal"
      data-collapsed={collapsed ? 'true' : 'false'}
    >
      <div className={styles.brandBlock}>
        <Link href="/home" className={styles.brand} title={brand}>
          <BrandMark className={styles.brandMark} />
          {!collapsed ? (
            <span className={styles.brandCopy}>
              <span className={styles.brandText}>{brand}</span>
              <span className={styles.brandTag}>Plataforma</span>
            </span>
          ) : null}
        </Link>
      </div>

      <nav className={styles.nav}>
        {items.map((item) => {
          if (item.type === 'divider') {
            return (
              <div
                key={item.id}
                className={styles.divider}
                role="separator"
                aria-label={item.label || 'Administração'}
              >
                {!collapsed ? (
                  <span className={styles.dividerLabel}>{item.label}</span>
                ) : (
                  <span className={styles.dividerDot} aria-hidden="true" />
                )}
              </div>
            );
          }

          const isActive = item.id === activeId;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={[styles.navItem, isActive ? styles.navItemActive : '']
                .filter(Boolean)
                .join(' ')}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
              data-tour={`tour-nav-${item.id}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
              {collapsed && (
                <span className={styles.tooltip} role="tooltip">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {onToggleCollapse && (
        <button
          type="button"
          className={styles.collapseBtn}
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            {collapsed ? (
              <path d="M9 18l6-6-6-6" />
            ) : (
              <path d="M15 18l-6-6 6-6" />
            )}
          </svg>
        </button>
      )}
    </aside>
  );
}
