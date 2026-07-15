'use client';

import LandingNav from '@/components/landing/LandingNav/LandingNav';
import LandingHero from '@/components/landing/LandingHero/LandingHero';
import LandingProduct from '@/components/landing/LandingProduct/LandingProduct';
import LandingHow from '@/components/landing/LandingHow/LandingHow';
import LandingPlans from '@/components/landing/LandingPlans/LandingPlans';
import LandingFeatures from '@/components/landing/LandingFeatures/LandingFeatures';
import LandingApp from '@/components/landing/LandingApp/LandingApp';
import LandingFaq from '@/components/landing/LandingFaq/LandingFaq';
import LandingCta from '@/components/landing/LandingCta/LandingCta';
import LandingFooter from '@/components/landing/LandingFooter/LandingFooter';
import LandingFooterBackground from '@/components/landing/LandingFooter/LandingFooterBackground';
import styles from './LandingPage.module.css';

export default function LandingPage({ onLogin, onRegister }) {
  return (
    <div className={styles.page}>
      <LandingNav onLogin={onLogin} onRegister={onRegister} />
      <main className={styles.main}>
        <LandingHero onRegister={onRegister} />
        <LandingProduct onRegister={onRegister} />
        <LandingHow />
        <LandingPlans onSelectPlan={onRegister} />
        <LandingFeatures />
        <LandingApp />
        <LandingFaq />
        <LandingCta onLogin={onLogin} onRegister={onRegister} />
      </main>
      <LandingFooter onLogin={onLogin} onRegister={onRegister} />
      <LandingFooterBackground />
    </div>
  );
}
