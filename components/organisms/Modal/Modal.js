'use client';

import { useEffect } from 'react';
import Button from '@/components/atoms/Button/Button';
import styles from './Modal.module.css';

/**
 * Organism: Modal / BottomSheet
 * Mobile: bottom sheet. Desktop: centered dialog.
 * @param {boolean} isOpen
 * @param {Function} onClose
 * @param {string} title
 * @param {ReactNode} footer
 * @param {'md'|'lg'} size
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  className = '',
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={[
          styles.sheet,
          size === 'lg' ? styles.sheetLg : '',
          className,
        ].filter(Boolean).join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div className={styles.dragHandle} aria-hidden="true" />
          <div className={styles.headerRow}>
            <h2 className={styles.title}>{title}</h2>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
              ✕
            </button>
          </div>
        </div>
        <div className={styles.content}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}
