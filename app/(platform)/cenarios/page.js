'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Badge from '@/components/atoms/Badge/Badge';
import Spinner from '@/components/atoms/Spinner/Spinner';
import Toast from '@/components/molecules/Toast/Toast';
import Pagination from '@/components/molecules/Pagination/Pagination';
import { api } from '@/lib/api';
import { normalizeScenario } from '@/lib/normalize';
import styles from './cenarios.module.css';

const CATEGORIES = [
  'Todos',
  'Caixa e Balcão',
  'Mesa Comercial',
  'Conta e Relacionamento',
  'Crédito Disponível',
  'Sem Crédito Disponível',
  'Produto Já Contratado',
  'Aposentado/Consignado',
  'Cartão',
  'MEI/Pequeno Negócio',
];

const DIFFICULTIES = ['Todos', 'Iniciante', 'Intermediário', 'Avançado'];

function difficultyVariant(difficulty) {
  if (difficulty === 'Iniciante') return 'success';
  if (difficulty === 'Intermediário') return 'warning';
  if (difficulty === 'Avançado') return 'danger';
  return 'default';
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 19.5c1.6-3.2 4-4.8 7-4.8s5.4 1.6 7 4.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12h12M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function CenariosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState('');
  const [scenarios, setScenarios] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [difficulty, setDifficulty] = useState('Todos');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((current) => ({ ...current, visible: false })), 3500);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/scenarios');
        const list = res?.data || res || [];
        const normalized = (Array.isArray(list) ? list : []).map(normalizeScenario);
        setScenarios(normalized);
      } catch (err) {
        showToast(err.message || 'Não foi possível carregar os cenários.', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, category, difficulty, pageSize]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return scenarios.filter((item) => {
      const matchCategory = category === 'Todos' || item.category === category;
      const matchDifficulty = difficulty === 'Todos' || item.difficulty === difficulty;
      if (!matchCategory || !matchDifficulty) return false;
      if (!term) return true;
      const haystack = [
        item.title,
        item.description,
        item.clientName,
        item.clientProfile,
        item.mainProduct,
        item.userObjective,
        ...(item.tags || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [scenarios, search, category, difficulty]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const startTraining = async (scenario) => {
    if (!scenario?.id || startingId) return;
    setStartingId(scenario.id);
    try {
      const res = await api.post('/simulations', { scenarioId: scenario.id });
      const simulation = res?.data || res;
      if (!simulation?.id) {
        throw new Error('Simulação criada sem identificador.');
      }
      router.push(`/simulacao/${simulation.id}`);
    } catch (err) {
      showToast(err.message || 'Não foi possível iniciar o treino.', 'error');
      setStartingId('');
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (startingId) {
    return (
      <div className={styles.startingOverlay}>
        <Spinner size="lg" />
        <p>Abrindo o atendimento...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <p className={styles.eyebrow}>Treino</p>
          <h1 className={styles.title}>Cenários de atendimento</h1>
          <p className={styles.subtitle}>
            Escolha uma situação e entre direto no chat com o cliente simulado.
          </p>
        </div>
        <p className={styles.count}>
          {filtered.length} {filtered.length === 1 ? 'cenário' : 'cenários'}
          {filtered.length > pageSize ? ` · pág. ${page}` : ''}
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
              placeholder="Título, cliente, produto..."
              aria-label="Buscar cenários"
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
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Dificuldade</span>
          <select
            className={styles.select}
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            {DIFFICULTIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <h2 className={styles.emptyTitle}>Nenhum cenário encontrado</h2>
          <p className={styles.emptyText}>Ajuste a busca ou os filtros e tente de novo.</p>
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {paginated.map((scenario) => {
              const clientLine = [
                scenario.clientName,
                scenario.clientAge ? `${scenario.clientAge} anos` : null,
              ]
                .filter(Boolean)
                .join(', ');

              return (
                <button
                  key={scenario.id}
                  type="button"
                  className={styles.tile}
                  onClick={() => startTraining(scenario)}
                  disabled={Boolean(startingId)}
                >
                  <div className={styles.badges}>
                    <Badge size="sm">{scenario.category}</Badge>
                    <Badge size="sm" variant={difficultyVariant(scenario.difficulty)}>
                      {scenario.difficulty}
                    </Badge>
                  </div>

                  <h3 className={styles.tileTitle}>{scenario.title}</h3>

                  {scenario.description ? (
                    <p className={styles.tileDesc}>{scenario.description}</p>
                  ) : null}

                  {scenario.userObjective ? (
                    <p className={styles.objective}>{scenario.userObjective}</p>
                  ) : null}

                  <div className={styles.metaList}>
                    {scenario.clientProfile ? (
                      <div className={styles.metaItem}>
                        <span className={styles.metaKey}>Perfil</span>
                        <p className={styles.metaValue}>{scenario.clientProfile}</p>
                      </div>
                    ) : null}

                    {scenario.mainProduct ? (
                      <div className={styles.metaItem}>
                        <span className={styles.metaKey}>Produto</span>
                        <p className={styles.metaValue}>{scenario.mainProduct}</p>
                      </div>
                    ) : null}
                  </div>

                  {Array.isArray(scenario.tags) && scenario.tags.length > 0 ? (
                    <div className={styles.tags}>
                      {scenario.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className={styles.tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className={styles.tileFooter}>
                    <span className={styles.client}>
                      <UserIcon />
                      {clientLine || 'Cliente do cenário'}
                    </span>
                    <span className={styles.cta} aria-hidden="true">
                      <ArrowIcon />
                    </span>
                  </div>
                </button>
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
