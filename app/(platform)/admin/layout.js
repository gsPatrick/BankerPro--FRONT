'use client';

import Spinner from '@/components/atoms/Spinner/Spinner';
import { useAdminGate } from './useAdminGate';
import styles from './admin.module.css';

export default function AdminLayout({ children }) {
  const { ready, allowed } = useAdminGate();

  if (!ready) {
    return (
      <div className={styles.loading}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className={styles.denied}>
        <p>Acesso restrito a administradores.</p>
      </div>
    );
  }

  return children;
}
