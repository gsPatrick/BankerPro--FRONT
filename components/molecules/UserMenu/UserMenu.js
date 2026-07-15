'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import styles from './UserMenu.module.css';

/**
 * Molecule: UserMenu
 * Avatar trigger + dropdown (perfil, configurações, sair)
 */
export default function UserMenu({ user, onLogout, onStartTour }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handleClickOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const displayName = user?.fullName || user?.email || 'Usuário';
  const initials = String(displayName)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu do usuário"
        data-tour="tour-user-menu"
      >
        {user?.avatarUrl ? (
          <span className={styles.avatar}>
            <img src={user.avatarUrl} alt="" className={styles.avatarImg} />
          </span>
        ) : (
          <span className={styles.avatar} aria-hidden="true">
            {initials}
          </span>
        )}
      </button>

      {open && (
        <div className={styles.dropdown} role="menu">
          <div className={styles.userBlock}>
            <span className={styles.userName}>{displayName}</span>
            {user?.email && <span className={styles.userEmail}>{user.email}</span>}
          </div>

          <Link
            href="/perfil"
            className={styles.item}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Perfil
          </Link>
          <Link
            href="/plano"
            className={styles.item}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Plano
          </Link>
          <Link
            href="/configuracoes"
            className={styles.item}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Configurações
          </Link>
          <button
            type="button"
            className={styles.item}
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onStartTour?.();
            }}
          >
            Tour da plataforma
          </button>

          <button
            type="button"
            className={`${styles.item} ${styles.danger}`}
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout?.();
            }}
          >
            Sair da conta
          </button>
        </div>
      )}
    </div>
  );
}
