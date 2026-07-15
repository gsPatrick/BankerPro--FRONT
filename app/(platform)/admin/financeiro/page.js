'use client';

import { useEffect, useState } from 'react';
import Spinner from '@/components/atoms/Spinner/Spinner';
import Toast from '@/components/molecules/Toast/Toast';
import { api } from '@/lib/api';
import styles from '../admin.module.css';

export default function AdminFinanceiroPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((c) => ({ ...c, visible: false })), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/financeiro');
      setSummary(res?.data || res || null);
    } catch (err) {
      showToast(err.message || 'Erro ao carregar dados financeiros.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatPrice = (price) => {
    const val = Number(price);
    if (!Number.isFinite(val)) return 'R$ 0,00';
    return `R$ ${val.toFixed(2).replace('.', ',')}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner size="lg" />
        <span>Carregando dados financeiros...</span>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className={styles.empty}>
        <p>Não foi possível carregar o resumo financeiro.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Administração</p>
          <h1 className={styles.title}>Financeiro</h1>
          <p className={styles.subtitle}>
            Resumo geral de faturamento, recorrência e histórico de compras.
          </p>
        </div>
      </header>

      {/* Metrics Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
        marginBottom: '8px'
      }}>
        <div className={styles.panel} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>MRR (Faturamento Recorrente Mensal)</span>
          <strong style={{ fontSize: '28px', color: '#ffffff', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
            {formatPrice(summary.metrics?.mrr || 0)}
          </strong>
          <span style={{ fontSize: '12px', color: '#6ee7a8', fontWeight: 600 }}>🔥 Recorrência líquida ativa</span>
        </div>

        <div className={styles.panel} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>Faturamento Anual Equivalente</span>
          <strong style={{ fontSize: '28px', color: '#ffffff', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
            {formatPrice((summary.metrics?.mrr || 0) * 12)}
          </strong>
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>🚀 ARR Projetado</span>
        </div>

        <div className={styles.panel} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>Assinaturas Ativas</span>
          <strong style={{ fontSize: '28px', color: '#ffffff', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
            {summary.metrics?.activeSubscriptions || 0}
          </strong>
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>👥 Clientes recorrentes pagos</span>
        </div>
      </div>

      {/* History Table */}
      <div className={styles.panel}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(242, 244, 247, 0.08)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff', margin: 0 }}>Histórico de Assinaturas e Compras</h2>
        </div>
        
        <div className={styles.tableWrap}>
          {summary.history?.length === 0 ? (
            <div className={styles.empty}>Nenhuma transação ou assinatura registrada no momento.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Plano</th>
                  <th>Valor</th>
                  <th>Método</th>
                  <th>Status</th>
                  <th>Início</th>
                </tr>
              </thead>
              <tbody>
                {summary.history?.map((sub) => {
                  const statusLabel = sub.status === 'active' ? 'Ativo' : sub.status === 'cancelled' ? 'Cancelado' : 'Expirado';
                  const statusClass = sub.status === 'active' ? styles.badgeOk : styles.badgeOff;

                  return (
                    <tr key={sub.id}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <strong style={{ color: '#ffffff' }}>{sub.userName}</strong>
                          <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>{sub.userEmail}</span>
                        </div>
                      </td>
                      <td>
                        <strong>{sub.planName}</strong>
                      </td>
                      <td>
                        <strong>{formatPrice(sub.planPrice)}</strong>
                      </td>
                      <td>
                        <span style={{ textTransform: 'uppercase', fontSize: '12px' }}>
                          {sub.paymentMethod === 'credit_card' ? 'Cartão' : sub.paymentMethod}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td>
                        {formatDate(sub.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {toast.visible && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast((c) => ({ ...c, visible: false }))} />
      )}
    </div>
  );
}
