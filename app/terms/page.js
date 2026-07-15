'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/atoms/Button/Button';
import Spinner from '@/components/atoms/Spinner/Spinner';
import Card from '@/components/molecules/Card/Card';
import { api } from '@/lib/api';
import styles from './page.module.css';

export default function TermsPage() {
  const router = useRouter();
  const [termsText, setTermsText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTerms() {
      try {
        const response = await api.get('/auth/terms');
        if (response.success && response.data) {
          setTermsText(response.data.text);
        }
      } catch (err) {
        setTermsText('Não foi possível carregar os termos de uso. Por favor, tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    }
    loadTerms();
  }, []);

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <button className={styles.backBtn} onClick={() => router.back()} aria-label="Voltar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span>Voltar</span>
          </button>
          <h1 className={styles.logo}>Closer.IA</h1>
        </div>
      </header>

      <main className={styles.main}>
        <Card variant="default" className={styles.documentCard}>
          <h2 className={styles.title}>Termos de Uso e Proteção de Dados (LGPD)</h2>
          <p className={styles.subtitle}>Última atualização: Julho 2026</p>
          
          <div className={styles.divider} />
          
          {loading ? (
            <div className={styles.loadingArea}>
              <Spinner size="lg" />
              <span>Carregando documento...</span>
            </div>
          ) : (
            <div className={styles.documentBody}>
              <p className={styles.text}>{termsText}</p>
            </div>
          )}

          <div className={styles.actionArea}>
            <Button variant="secondary" onClick={() => router.back()} size="md">
              Voltar para o Cadastro
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
