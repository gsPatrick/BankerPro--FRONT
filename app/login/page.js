'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/?view=gate');
  }, [router]);

  return (
    <div style={{ minHeight: '100dvh', background: '#0E0E0E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontFamily: 'sans-serif' }}>
      <span>Redirecionando...</span>
    </div>
  );
}
