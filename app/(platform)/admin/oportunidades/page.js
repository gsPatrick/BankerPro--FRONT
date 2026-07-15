'use client';

import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/atoms/Button/Button';
import Spinner from '@/components/atoms/Spinner/Spinner';
import Toast from '@/components/molecules/Toast/Toast';
import Modal from '@/components/organisms/Modal/Modal';
import { api } from '@/lib/api';
import { normalizeOpportunity } from '@/lib/normalize';
import styles from '../admin.module.css';

const PRODUCTS = [
  'Consórcio',
  'Financiamento',
  'Empréstimo',
  'Consignado',
  'Cartão de Crédito',
  'Seguro de Vida',
  'Capitalização',
];
const CHANNELS = ['Ligação', 'WhatsApp', 'Presencial'];

const EMPTY = {
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

export default function AdminOportunidadesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([]);
  const [productFilter, setProductFilter] = useState('Todos');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((c) => ({ ...c, visible: false })), 3500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/opportunities');
      const list = res?.data || res || [];
      setItems((Array.isArray(list) ? list : []).map(normalizeOpportunity));
    } catch (err) {
      showToast(err.message || 'Erro ao carregar oportunidades.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (productFilter === 'Todos') return items;
    return items.filter((item) => item.product === productFilter);
  }, [items, productFilter]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY);
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
    setFormOpen(true);
  };

  const save = async () => {
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
    if (!payload.title || !payload.product) {
      showToast('Informe título e produto.', 'error');
      return;
    }
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
      load();
    } catch (err) {
      showToast(err.message || 'Erro ao salvar.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Excluir "${item.title}"?`)) return;
    try {
      await api.delete(`/admin/opportunities/${item.id}`);
      showToast('Oportunidade removida.');
      load();
    } catch (err) {
      showToast(err.message || 'Erro ao excluir.', 'error');
    }
  };

  const toggleStatus = async (item) => {
    const next = item.status === 'Ativo' ? 'Inativo' : 'Ativo';
    try {
      await api.put(`/admin/opportunities/${item.id}`, { status: next });
      showToast(`Status: ${next}.`);
      load();
    } catch (err) {
      showToast(err.message || 'Erro ao alterar status.', 'error');
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
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Administração</p>
          <h1 className={styles.title}>Oportunidades</h1>
          <p className={styles.subtitle}>
            Cadastre roteiros comerciais por produto e perfil. Também alimentáveis via Codex.
          </p>
        </div>
        <Button type="button" variant="primary" onClick={openCreate}>
          Nova oportunidade
        </Button>
      </header>

      <label className={styles.field} style={{ maxWidth: 280 }}>
        <span className={styles.fieldLabel}>Filtrar produto</span>
        <select
          className={styles.select}
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value)}
        >
          <option value="Todos">Todos</option>
          {PRODUCTS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>

      <section className={styles.panel}>
        {filtered.length === 0 ? (
          <p className={styles.empty}>Nenhuma oportunidade neste filtro.</p>
        ) : (
          <div className={styles.list}>
            {filtered.map((item) => (
              <article key={item.id} className={styles.listItem}>
                <div>
                  <h3>{item.title}</h3>
                  <p>
                    {item.product} · {item.recommendedChannel} · {item.status}
                  </p>
                </div>
                <div className={styles.actions}>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleStatus(item)}
                  >
                    {item.status === 'Ativo' ? 'Inativar' : 'Ativar'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => openEdit(item)}
                  >
                    Editar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    onClick={() => remove(item)}
                  >
                    Excluir
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? 'Editar oportunidade' : 'Nova oportunidade'}
        size="lg"
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" onClick={save} disabled={saving}>
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
                onChange={(e) => setForm((f) => ({ ...f, product: e.target.value }))}
              >
                {PRODUCTS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Canal</span>
              <select
                className={styles.select}
                value={form.recommendedChannel}
                onChange={(e) =>
                  setForm((f) => ({ ...f, recommendedChannel: e.target.value }))
                }
              >
                {CHANNELS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className={styles.formRow}>
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
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Status</span>
              <select
                className={styles.select}
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </label>
          </div>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Perfil</span>
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
                onChange={(e) => setForm((f) => ({ ...f, ageRange: e.target.value }))}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Renda</span>
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
              onChange={(e) => setForm((f) => ({ ...f, objective: e.target.value }))}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Abertura</span>
            <textarea
              className={styles.textarea}
              value={form.openingScript}
              onChange={(e) =>
                setForm((f) => ({ ...f, openingScript: e.target.value }))
              }
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Perguntas (1 por linha)</span>
            <textarea
              className={styles.textarea}
              value={form.diagnosticQuestions}
              onChange={(e) =>
                setForm((f) => ({ ...f, diagnosticQuestions: e.target.value }))
              }
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Argumentação</span>
            <textarea
              className={styles.textarea}
              value={form.mainArgument}
              onChange={(e) =>
                setForm((f) => ({ ...f, mainArgument: e.target.value }))
              }
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Objeções (1 por linha)</span>
            <textarea
              className={styles.textarea}
              value={form.objections}
              onChange={(e) => setForm((f) => ({ ...f, objections: e.target.value }))}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Respostas (1 por linha)</span>
            <textarea
              className={styles.textarea}
              value={form.objectionResponses}
              onChange={(e) =>
                setForm((f) => ({ ...f, objectionResponses: e.target.value }))
              }
            />
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
            <span className={styles.fieldLabel}>Fechamento</span>
            <textarea
              className={styles.textarea}
              value={form.closingScript}
              onChange={(e) =>
                setForm((f) => ({ ...f, closingScript: e.target.value }))
              }
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Tags (vírgula)</span>
            <input
              className={styles.input}
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            />
          </label>
        </div>
      </Modal>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((c) => ({ ...c, visible: false }))}
      />
    </div>
  );
}
