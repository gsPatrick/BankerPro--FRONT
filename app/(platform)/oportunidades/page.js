'use client';

import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/atoms/Button/Button';
import Spinner from '@/components/atoms/Spinner/Spinner';
import Toast from '@/components/molecules/Toast/Toast';
import Pagination from '@/components/molecules/Pagination/Pagination';
import Modal from '@/components/organisms/Modal/Modal';
import { api } from '@/lib/api';
import { normalizeOpportunity } from '@/lib/normalize';
import styles from './oportunidades.module.css';

const PRODUCTS = [
  'Todos',
  'Consórcio',
  'Financiamento',
  'Empréstimo',
  'Consignado',
  'Cartão de Crédito',
  'Seguro de Vida',
  'Capitalização',
];

const CHANNELS = ['Todos', 'Ligação', 'WhatsApp', 'Presencial'];

const EMPTY_FORM = {
  title: '',
  product: 'Capitalização',
  alternativeProduct: '',
  clientProfile: '',
  ageRange: '',
  incomeRange: '',
  balanceRange: '',
  recommendedChannel: 'Ligação',
  objective: '',
  openingScript: '',
  diagnosticQuestions: '',
  mainArgument: '',
  objections: '',
  objectionResponses: '',
  fallbackPlan: '',
  closingScript: '',
  tags: '',
  status: 'Ativo',
};

function linesToText(list) {
  return Array.isArray(list) ? list.join('\n') : '';
}

function textToLines(value) {
  return String(value || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

// A faixa etária só vira chip quando é uma restrição de verdade. Valores genéricos
// ("Geral", "Todas", vazio) não agregam e só poluiriam o card.
function isMeaningfulAge(value) {
  const v = String(value || '').trim().toLowerCase();
  if (!v) return false;
  return !['geral', '-', '—', 'todos', 'todas', 'todas as idades', 'qualquer'].includes(v);
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M16.5 16.5L21 21"
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

function readIsAdmin() {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem('bankerpro_user');
    const user = raw ? JSON.parse(raw) : null;
    return user?.role === 'admin';
  } catch {
    return false;
  }
}

function DetailSection({ title, children }) {
  if (!children) return null;
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      {children}
    </section>
  );
}

export default function OportunidadesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [product, setProduct] = useState('Todos');
  const [channel, setChannel] = useState('Todos');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const [selected, setSelected] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success',
  });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((current) => ({ ...current, visible: false })), 3500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const endpoint = isAdmin
        ? '/admin/opportunities'
        : '/commercial-opportunities';
      const res = await api.get(endpoint);
      const list = res?.data || res || [];
      setItems((Array.isArray(list) ? list : []).map(normalizeOpportunity));
    } catch (err) {
      showToast(err.message || 'Não foi possível carregar as oportunidades.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsAdmin(readIsAdmin());
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      if (product !== 'Todos' && item.product !== product) return false;
      if (channel !== 'Todos' && item.recommendedChannel !== channel) return false;
      if (!term) return true;
      const hay = [
        item.title,
        item.product,
        item.clientProfile,
        item.objective,
        item.ageRange,
        item.incomeRange,
        ...(item.tags || []),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(term);
    });
  }, [items, product, channel, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [product, channel, search, pageSize]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      product: item.product || 'Capitalização',
      alternativeProduct: item.alternativeProduct,
      clientProfile: item.clientProfile,
      ageRange: item.ageRange,
      incomeRange: item.incomeRange,
      balanceRange: item.balanceRange,
      recommendedChannel: item.recommendedChannel || 'Ligação',
      objective: item.objective,
      openingScript: item.openingScript,
      diagnosticQuestions: linesToText(item.diagnosticQuestions),
      mainArgument: item.mainArgument,
      objections: linesToText(item.objections),
      objectionResponses: linesToText(item.objectionResponses),
      fallbackPlan: item.fallbackPlan,
      closingScript: item.closingScript,
      tags: (item.tags || []).join(', '),
      status: item.status || 'Ativo',
    });
    setSelected(null);
    setFormOpen(true);
  };

  const saveForm = async () => {
    if (!form.title.trim() || !form.product) {
      showToast('Informe título e produto.', 'error');
      return;
    }

    const payload = {
      title: form.title.trim(),
      product: form.product,
      alternativeProduct: form.alternativeProduct.trim(),
      clientProfile: form.clientProfile.trim(),
      ageRange: form.ageRange.trim(),
      incomeRange: form.incomeRange.trim(),
      balanceRange: form.balanceRange.trim(),
      recommendedChannel: form.recommendedChannel,
      objective: form.objective.trim(),
      openingScript: form.openingScript.trim(),
      diagnosticQuestions: textToLines(form.diagnosticQuestions),
      mainArgument: form.mainArgument.trim(),
      objections: textToLines(form.objections),
      objectionResponses: textToLines(form.objectionResponses),
      fallbackPlan: form.fallbackPlan.trim(),
      closingScript: form.closingScript.trim(),
      tags: form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      status: form.status,
    };

    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/admin/opportunities/${editingId}`, payload);
        showToast('Oportunidade atualizada.');
      } else {
        await api.post('/admin/opportunities', payload);
        showToast('Oportunidade criada.');
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      showToast(err.message || 'Não foi possível salvar.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async (item) => {
    if (!window.confirm(`Excluir "${item.title}"?`)) return;
    try {
      await api.delete(`/admin/opportunities/${item.id}`);
      showToast('Oportunidade excluída.');
      setSelected(null);
      await load();
    } catch (err) {
      showToast(err.message || 'Não foi possível excluir.', 'error');
    }
  };

  const toggleStatus = async (item) => {
    const next = item.status === 'Ativo' ? 'Inativo' : 'Ativo';
    try {
      await api.put(`/admin/opportunities/${item.id}`, { status: next });
      showToast(next === 'Ativo' ? 'Oportunidade ativada.' : 'Oportunidade inativada.');
      setSelected((current) =>
        current?.id === item.id ? { ...current, status: next } : current
      );
      await load();
    } catch (err) {
      showToast(err.message || 'Não foi possível atualizar o status.', 'error');
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.banner}>
        <div className={styles.bannerCopy}>
          <p className={styles.eyebrow}>Ferramenta comercial</p>
          <h1 className={styles.title}>Scripts</h1>
          <p className={styles.subtitle}>
            Escolha o produto que deseja trabalhar e veja roteiros prontos para
            abordar clientes com mais segurança.
          </p>
        </div>
        <div className={styles.bannerActions}>
          <p className={styles.count}>
            {filtered.length} roteiro{filtered.length === 1 ? '' : 's'}
          </p>
          {isAdmin ? (
            <Button type="button" variant="primary" onClick={openCreate}>
              Nova oportunidade
            </Button>
          ) : null}
        </div>
      </section>

      <div className={styles.productTabs}>
        {PRODUCTS.map((item) => (
          <button
            key={item}
            type="button"
            className={`${styles.productTab} ${
              product === item ? styles.productTabActive : ''
            }`}
            onClick={() => setProduct(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className={styles.toolbar}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Buscar</span>
          <div className={styles.searchWrap}>
            <SearchIcon />
            <input
              className={styles.searchInput}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Perfil, tag, objetivo…"
            />
          </div>
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Canal</span>
          <select
            className={styles.selectInput}
            value={channel}
            onChange={(event) => setChannel(event.target.value)}
          >
            {CHANNELS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>

      {pageItems.length > 0 ? (
        <div className={styles.grid}>
          {pageItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={styles.card}
              onClick={() => setSelected(item)}
            >
              <div className={styles.cardTop}>
                <span className={styles.productBadge}>{item.product}</span>
                <span className={styles.channelBadge}>
                  {item.recommendedChannel || '—'}
                  {isAdmin && item.status !== 'Ativo' ? ' · Inativo' : ''}
                </span>
              </div>
              <h2 className={styles.cardTitle}>{item.title}</h2>
              {isMeaningfulAge(item.ageRange) ? (
                <span className={styles.cardAge}>{item.ageRange}</span>
              ) : null}
              <div className={styles.cardFooter}>
                <span className={styles.footerLabel}>Ver abordagem</span>
                <span className={styles.cta} aria-hidden="true">
                  <ArrowIcon />
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          Nenhuma oportunidade para este filtro. Ajuste o produto ou alimente a
          base via Codex/admin.
        </div>
      )}

      {filtered.length > 0 ? (
        <Pagination
          page={page}
          pageSize={pageSize}
          totalItems={filtered.length}
          pageSizes={[6, 9, 12, 15]}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      ) : null}

      <Modal
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.title || 'Abordagem'}
        size="lg"
        footer={
          <>
            {isAdmin && selected ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => toggleStatus(selected)}
                >
                  {selected.status === 'Ativo' ? 'Inativar' : 'Ativar'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => removeItem(selected)}
                >
                  Excluir
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => openEdit(selected)}
                >
                  Editar
                </Button>
              </>
            ) : null}
            <Button type="button" variant="primary" onClick={() => setSelected(null)}>
              Fechar
            </Button>
          </>
        }
      >
        {selected ? (
          <div className={styles.detail}>
            <p className={styles.detailLead}>
              {selected.clientProfile || 'Perfil não informado.'}
            </p>

            <div className={styles.detailMeta}>
              <div className={styles.detailChip}>
                <span>Produto</span>
                <strong>{selected.product || '—'}</strong>
              </div>
              <div className={styles.detailChip}>
                <span>Plano B</span>
                <strong>{selected.alternativeProduct || '—'}</strong>
              </div>
              <div className={styles.detailChip}>
                <span>Canal</span>
                <strong>{selected.recommendedChannel || '—'}</strong>
              </div>
              <div className={styles.detailChip}>
                <span>Faixa etária</span>
                <strong>{selected.ageRange || '—'}</strong>
              </div>
              <div className={styles.detailChip}>
                <span>Renda</span>
                <strong>{selected.incomeRange || '—'}</strong>
              </div>
              <div className={styles.detailChip}>
                <span>Saldo / relacionamento</span>
                <strong>{selected.balanceRange || '—'}</strong>
              </div>
            </div>

            <DetailSection title="Objetivo da abordagem">
              {selected.objective ? (
                <p className={styles.sectionBody}>{selected.objective}</p>
              ) : null}
            </DetailSection>

            <DetailSection title="Script de abertura">
              {selected.openingScript ? (
                <p className={styles.sectionBody}>{selected.openingScript}</p>
              ) : null}
            </DetailSection>

            <DetailSection title="Perguntas de diagnóstico">
              {selected.diagnosticQuestions.length > 0 ? (
                <ul className={styles.bulletList}>
                  {selected.diagnosticQuestions.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              ) : null}
            </DetailSection>

            <DetailSection title="Argumentação principal">
              {selected.mainArgument ? (
                <p className={styles.sectionBody}>{selected.mainArgument}</p>
              ) : null}
            </DetailSection>

            <DetailSection title="Objeções comuns">
              {selected.objections.length > 0 ? (
                <ul className={styles.bulletList}>
                  {selected.objections.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </DetailSection>

            <DetailSection title="Respostas para objeções">
              {selected.objectionResponses.length > 0 ? (
                <ul className={styles.bulletList}>
                  {selected.objectionResponses.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </DetailSection>

            <DetailSection title="Plano B / produto alternativo">
              {selected.fallbackPlan || selected.alternativeProduct ? (
                <p className={styles.sectionBody}>
                  {selected.fallbackPlan ||
                    `Alternativa sugerida: ${selected.alternativeProduct}`}
                </p>
              ) : null}
            </DetailSection>

            <DetailSection title="Fechamento sugerido">
              {selected.closingScript ? (
                <p className={styles.sectionBody}>{selected.closingScript}</p>
              ) : null}
            </DetailSection>

            {selected.tags.length > 0 ? (
              <div className={styles.tagRow}>
                {selected.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? 'Editar oportunidade' : 'Nova oportunidade'}
        size="lg"
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setFormOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={saveForm}
              disabled={saving}
            >
              {saving ? 'Salvando…' : 'Salvar'}
            </Button>
          </>
        }
      >
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Título</span>
            <input
              className={styles.input}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </label>

          <div className={styles.formRow}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Produto</span>
              <select
                className={styles.select}
                value={form.product}
                onChange={(e) =>
                  setForm((f) => ({ ...f, product: e.target.value }))
                }
              >
                {PRODUCTS.filter((item) => item !== 'Todos').map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Produto alternativo</span>
              <input
                className={styles.input}
                value={form.alternativeProduct}
                onChange={(e) =>
                  setForm((f) => ({ ...f, alternativeProduct: e.target.value }))
                }
              />
            </label>
          </div>

          <div className={styles.formRow}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Canal</span>
              <select
                className={styles.select}
                value={form.recommendedChannel}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    recommendedChannel: e.target.value,
                  }))
                }
              >
                {CHANNELS.filter((item) => item !== 'Todos').map((item) => (
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
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value }))
                }
              >
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </label>
          </div>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Perfil do cliente</span>
            <textarea
              className={styles.textarea}
              value={form.clientProfile}
              onChange={(e) =>
                setForm((f) => ({ ...f, clientProfile: e.target.value }))
              }
            />
          </label>

          <div className={styles.formRow}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Faixa etária</span>
              <input
                className={styles.input}
                value={form.ageRange}
                onChange={(e) =>
                  setForm((f) => ({ ...f, ageRange: e.target.value }))
                }
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Faixa de renda</span>
              <input
                className={styles.input}
                value={form.incomeRange}
                onChange={(e) =>
                  setForm((f) => ({ ...f, incomeRange: e.target.value }))
                }
              />
            </label>
          </div>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Saldo / relacionamento</span>
            <input
              className={styles.input}
              value={form.balanceRange}
              onChange={(e) =>
                setForm((f) => ({ ...f, balanceRange: e.target.value }))
              }
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Objetivo</span>
            <textarea
              className={styles.textarea}
              value={form.objective}
              onChange={(e) =>
                setForm((f) => ({ ...f, objective: e.target.value }))
              }
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Script de abertura</span>
            <textarea
              className={styles.textarea}
              value={form.openingScript}
              onChange={(e) =>
                setForm((f) => ({ ...f, openingScript: e.target.value }))
              }
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Perguntas de diagnóstico</span>
            <textarea
              className={styles.textarea}
              value={form.diagnosticQuestions}
              onChange={(e) =>
                setForm((f) => ({ ...f, diagnosticQuestions: e.target.value }))
              }
            />
            <p className={styles.hint}>Uma pergunta por linha.</p>
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Argumentação principal</span>
            <textarea
              className={styles.textarea}
              value={form.mainArgument}
              onChange={(e) =>
                setForm((f) => ({ ...f, mainArgument: e.target.value }))
              }
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Objeções comuns</span>
            <textarea
              className={styles.textarea}
              value={form.objections}
              onChange={(e) =>
                setForm((f) => ({ ...f, objections: e.target.value }))
              }
            />
            <p className={styles.hint}>Uma objeção por linha.</p>
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Respostas para objeções</span>
            <textarea
              className={styles.textarea}
              value={form.objectionResponses}
              onChange={(e) =>
                setForm((f) => ({ ...f, objectionResponses: e.target.value }))
              }
            />
            <p className={styles.hint}>Uma resposta por linha.</p>
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Plano B</span>
            <textarea
              className={styles.textarea}
              value={form.fallbackPlan}
              onChange={(e) =>
                setForm((f) => ({ ...f, fallbackPlan: e.target.value }))
              }
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Fechamento sugerido</span>
            <textarea
              className={styles.textarea}
              value={form.closingScript}
              onChange={(e) =>
                setForm((f) => ({ ...f, closingScript: e.target.value }))
              }
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Tags</span>
            <input
              className={styles.input}
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              placeholder="jovem, capitalização, whatsapp"
            />
            <p className={styles.hint}>Separadas por vírgula.</p>
          </label>
        </div>
      </Modal>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((current) => ({ ...current, visible: false }))}
      />
    </div>
  );
}
