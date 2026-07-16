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
