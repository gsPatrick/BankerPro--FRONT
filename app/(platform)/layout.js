'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/organisms/AppShell/AppShell';
import PlanUpgradeGate from '@/components/organisms/PlanUpgradeGate/PlanUpgradeGate';
import Spinner from '@/components/atoms/Spinner/Spinner';
import { api } from '@/lib/api';
import { isOnboardingCompleted } from '@/lib/onboarding';

export default function PlatformLayout({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [user, setUser] = useState(null);

  // PWA: pede armazenamento persistente para o navegador NÃO descartar o localStorage
  // sob pressão de espaço — é o que evita perder o token (e "deslogar") no app instalado.
  // Silencioso e sem efeito colateral se o navegador não suportar.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.storage?.persist) return;
    Promise.resolve(navigator.storage.persisted?.())
      .then((already) => {
        if (!already) navigator.storage.persist().catch(() => {});
      })
      .catch(() => {
        navigator.storage.persist().catch(() => {});
      });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const gate = async () => {
      const token = localStorage.getItem('bankerpro_token');
      if (!token) {
        router.replace('/?view=gate');
        return;
      }

      let nextUser = null;
      let incomplete = false;

      try {
        const me = await api.get('/auth/me');
        const data = me?.data || me;
        nextUser = {
          id: data.id,
          email: data.email,
          fullName: data.fullName || data.full_name || '',
          role: data.role,
          whatsapp: data.whatsapp,
          onboardingCompleted: Boolean(data.onboardingCompleted || data.onboarding_completed || data.profile?.onboardingCompleted || data.profile?.onboarding_completed),
          avatarUrl: data.avatarUrl || data.avatar_url || data.profile?.avatarUrl || data.profile?.avatar_url || null,
          permissions: Array.isArray(data.permissions) ? data.permissions : [],
        };
        localStorage.setItem('bankerpro_user', JSON.stringify(nextUser));
        incomplete = !isOnboardingCompleted(data);
      } catch {
        try {
          const raw = localStorage.getItem('bankerpro_user');
          nextUser = raw ? JSON.parse(raw) : null;
          incomplete = !isOnboardingCompleted(nextUser);
        } catch {
          incomplete = true;
        }
      }

      if (!cancelled) {
        setUser(nextUser);
        setNeedsOnboarding(incomplete);
        setReady(true);
      }
    };

    gate();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) {
    return (
      <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: 'var(--color-canvas)' }}>
        <Spinner />
      </div>
    );
  }

  return (
    <AppShell
      initialUser={user}
      needsOnboarding={needsOnboarding}
      onOnboardingComplete={() => setNeedsOnboarding(false)}
    >
      {children}
      <PlanUpgradeGate />
    </AppShell>
  );
}
