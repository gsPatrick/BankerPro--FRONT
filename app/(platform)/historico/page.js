'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Badge from '@/components/atoms/Badge/Badge';
import Button from '@/components/atoms/Button/Button';
import Spinner from '@/components/atoms/Spinner/Spinner';
import Toast from '@/components/molecules/Toast/Toast';
import Pagination from '@/components/molecules/Pagination/Pagination';
import { api } from '@/lib/api';
import { normalizeSimulation } from '@/lib/normalize';
import styles from './historico.module.css';

function formatScore(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0';
  return Number.isInteger(num) ? String(num) : num.toFixed(1);
}

function scoreTone(score) {
  const value = Number(score) || 0;
  if (value >= 40) return 'Excellent';
  if (value >= 30) return 'Good';
  if (value >= 20) return 'Regular';
  return 'Bad';
}

function scoreBoxClass(tone) {
  if (tone === 'Excellent') return styles.scoreExcellent;
  if (tone === 'Good') return styles.scoreGood;
  if (tone === 'Regular') return styles.scoreRegular;
  return styles.scoreBad;
}

function resultTag(score) {
  const value = Number(score) || 0;
  if (value >= 40) return { text: 'Negociação concluída', className: styles.tagOk };
  if (value >= 25) return { text: 'Parcial', className: styles.tagMid };
  return { text: 'Sem fechamento', className: styles.tagBad };
}

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg className={styles.chevron} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function HistoricoPage() {
  const [loading, setLoading] = useState(true);
  const [simulations, setSimulations] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [status, setStatus] = useState('completed');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((current) => ({ ...current, visible: false })), 3500);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const query = status === 'all' ? '' : `?status=${encodeURIComponent(status)}`;
        const res = await api.get(`/simulations${query}`);
        const list = res?.data || res || [];
        setSimulations((Array.isArray(list) ? list : []).map(normalizeSimulation));
      } catch (err) {
        showToast(err.message || 'Não foi possível carregar o histórico.', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [status]);

  useEffect(() => {
    setPage(1);
  }, [search, category, status, pageSize]);

  const categories = useMemo(() => {
    const set = new Set(
      simulations.map((item) => item.scenarioCategory).filter(Boolean)
    );
    return ['Todos', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'))];
  }, [simulations]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return simulations.filter((item) => {
      const matchCategory =
        category === 'Todos' || item.scenarioCategory === category;
      if (!matchCategory) return false;
      if (!term) return true;
      const haystack = [item.scenarioTitle, item.scenarioCategory]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [simulations, search, category]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <p className={styles.eyebrow}>Treino</p>
          <h1 className={styles.title}>Histórico de simulações</h1>
          <p className={styles.subtitle}>
            Revise atendimentos anteriores, acompanhe a evolução e reabra o resultado.
          </p>
        </div>
        <p className={styles.count}>
          {filtered.length} {filtered.length === 1 ? 'registro' : 'registros'}
        </p>
      </header>

      <div className={styles.toolbar}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Buscar</span>
          <span className={styles.searchWrap}>
            <SearchIcon />
            <input
              className={styles.search}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Título ou categoria..."
              aria-label="Buscar no histórico"
            />
          </span>
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Categoria</span>
          <select
            className={styles.select}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Status</span>
          <select
            className={styles.select}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="completed">Concluídas</option>
            <option value="in_progress">Em andamento</option>
            <option value="all">Todas</option>
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <h2 className={styles.emptyTitle}>Nenhuma simulação encontrada</h2>
          <p className={styles.emptyText}>
            {status === 'completed'
              ? 'Finalize um atendimento para ver o resultado no histórico.'
              : 'Ajuste os filtros ou inicie um novo cenário.'}
          </p>
          <Link href="/cenarios">
            <Button variant="primary">Ir para cenários</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className={styles.list}>
            {paginated.map((sim) => {
              const tone = scoreTone(sim.scoreTotal);
              const tag = resultTag(sim.scoreTotal);
              const isCompleted = sim.status === 'completed';
              const href = isCompleted
                ? `/simulacao/${sim.id}/resultado`
                : `/simulacao/${sim.id}`;

              return (
                <Link key={sim.id} href={href} className={styles.row}>
                  <div className={`${styles.scoreBox} ${scoreBoxClass(tone)}`}>
                    {formatScore(sim.scoreTotal)}
                  </div>

                  <div className={styles.body}>
                    <h3 className={styles.rowTitle}>
                      {sim.scenarioTitle || 'Simulação sem título'}
                    </h3>
                    <div className={styles.meta}>
                      {sim.scenarioCategory ? (
                        <span className={styles.category}>{sim.scenarioCategory}</span>
                      ) : null}
                      <span>{Number(sim.durationMinutes || 0)} min</span>
                      <span>·</span>
                      <span>{formatDateTime(sim.createdAt || sim.updatedAt)}</span>
                      {!isCompleted ? (
                        <>
                          <span>·</span>
                          <Badge size="sm" variant="warning">
                            Em andamento
                          </Badge>
                        </>
                      ) : null}
                    </div>
                    {isCompleted ? (
                      <div className={styles.tags}>
                        <span className={`${styles.tag} ${tag.className}`}>{tag.text}</span>
                      </div>
                    ) : null}
                  </div>

                  <ChevronIcon />
                </Link>
              );
            })}
          </div>

          <Pagination
            page={page}
            pageSize={pageSize}
            totalItems={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((current) => ({ ...current, visible: false }))}
      />
    </div>
  );
}
