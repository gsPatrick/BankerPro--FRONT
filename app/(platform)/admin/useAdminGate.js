'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useAdminGate() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('bankerpro_user');
      const user = raw ? JSON.parse(raw) : null;
      const isAdmin = user?.role === 'admin';
      setAllowed(isAdmin);
      if (!isAdmin) {
        router.replace('/home');
      }
    } catch {
      router.replace('/home');
    } finally {
      setReady(true);
    }
  }, [router]);

  return { ready, allowed };
}
