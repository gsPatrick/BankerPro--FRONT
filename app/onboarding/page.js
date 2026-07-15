'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Legacy route — onboarding agora roda como modal na plataforma */
export default function OnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/home');
  }, [router]);

  return null;
}
