import Link from 'next/link';
import BrandMark from '@/components/BrandMark/BrandMark';
import styles from './offline.module.css';

export const metadata = {
  title: 'Offline · Closer.IA',
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className={styles.page}>
      <div className={styles.panel}>
        <BrandMark className={styles.markIcon} />
        <p className={styles.mark}>Closer.IA</p>
        <h1 className={styles.title}>Você está offline</h1>
        <p className={styles.text}>
          Sem conexão no momento. Assim que a internet voltar, o app sincroniza
          de novo.
        </p>
        <Link href="/" className={styles.cta}>
          Tentar novamente
        </Link>
      </div>
    </main>
  );
}
