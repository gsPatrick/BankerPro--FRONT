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
        const data = response?.data || response;
        if (data && (data.terms || data.text)) {
          setTermsText(data.terms || data.text);
        }
      } catch (err) {
        setTermsText('Não foi possível carregar os termos de uso. Por favor, tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    }
    loadTerms();
  }, []);

  const renderTermsContent = (text) => {
    if (!text) return null;
    return text.split('\n\n').map((block, idx) => {
      const trimmed = block.trim();
      if (!trimmed) return null;

      // Detect sub-headings like "1. Proteção de dados"
      if (/^\d+\./.test(trimmed) || trimmed.startsWith('TERMOS DE USO')) {
        return (
          <h3 key={idx} className={styles.sectionHeader}>
            {trimmed}
          </h3>
        );
      }

      return (
        <p key={idx} className={styles.paragraph}>
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <button className={styles.backBtn} onClick={() => router.back()} aria-label="Voltar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span>Voltar</span>
          </button>
          <h1 className={styles.logo}>Closer.IA</h1>
        </div>
      </header>

      <main className={styles.main}>
        <Card variant="default" className={styles.documentCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.title}>Termos de Uso e Proteção de Dados (LGPD)</h2>
            <p className={styles.subtitle}>Última atualização: Julho 2026</p>
          </div>
          
          <div className={styles.divider} />
          
          {loading ? (
            <div className={styles.loadingArea}>
              <Spinner size="lg" />
              <span>Carregando documento...</span>
            </div>
          ) : (
            <div className={styles.documentBody}>
              {renderTermsContent(termsText)}
            </div>
          )}

          <div className={styles.divider} />

          <div className={styles.actionArea}>
            <Button variant="secondary" onClick={() => router.back()} size="md" className={styles.actionBtn}>
              Voltar para o Cadastro
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
