'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/atoms/Button/Button';
import Spinner from '@/components/atoms/Spinner/Spinner';
import Toast from '@/components/molecules/Toast/Toast';
import Modal from '@/components/organisms/Modal/Modal';
import { api } from '@/lib/api';
import { pickField } from '@/lib/normalize';
import styles from '../admin.module.css';

// Espelha o catálogo de src/config/constants.js na API — a key é o que libera a
// tela de verdade. Painel, Perfil, Configurações e Planos não entram: são sempre
// liberados, senão o usuário não conseguiria nem contratar um upgrade.
const FEATURE_OPTIONS = [
  { key: 'cenarios', label: 'Cenários' },
  { key: 'historico', label: 'Histórico' },
  { key: 'ranking', label: 'Ranking' },
  { key: 'carteira', label: 'Carteira' },
  { key: 'agenda', label: 'Agenda' },
  { key: 'metas', label: 'Metas' },
  { key: 'anotacoes', label: 'Anotações' },
  { key: 'copiloto', label: 'Copiloto IA' },
  { key: 'oportunidades', label: 'Lista de Oportunidades' },
  { key: 'gerador', label: 'Gerador de abordagens' },
  { key: 'whatsapp_copilot', label: 'Copiloto no WhatsApp' },
];

// A cobrança do plano vive no sufixo da key: é ela que faz a landing e o checkout
// separarem os planos entre Mensal e Anual.
const BILLING_PERIODS = [
  { value: 'monthly', label: 'Mensal', suffix: '_monthly' },
  { value: 'yearly', label: 'Anual', suffix: '_yearly' },
];

function splitPlanKey(key = '') {
  const value = String(key).trim();
  for (const period of BILLING_PERIODS) {
    if (value.endsWith(period.suffix)) {
      return {
        keyBase: value.slice(0, -period.suffix.length),
        billingPeriod: period.value,
      };
    }
  }
  return { keyBase: value, billingPeriod: 'monthly' };
}

function buildPlanKey(keyBase, billingPeriod) {
  const base = String(keyBase)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/_(monthly|yearly)$/, '');
  if (!base) return '';
  const period =
    BILLING_PERIODS.find((item) => item.value === billingPeriod) ?? BILLING_PERIODS[0];
  return `${base}${period.suffix}`;
}

const EMPTY = {
  keyBase: '',
  billingPeriod: 'monthly',
  name: '',
  price: 0,
  limitSimulations: 10,
  permissions: [],
};

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12.5 10 17l9-11"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function normalizePlan(raw = {}) {
  return {
    id: pickField(raw, 'id'),
    key: pickField(raw, 'key') || '',
    name: pickField(raw, 'name') || '',
    price: Number(pickField(raw, 'price') ?? 0),
    limitSimulations: Number(
      pickField(raw, 'limitSimulations', 'limit_simulations') ?? 10
    ),
    permissions: Array.isArray(raw.permissions) ? raw.permissions : [],
  };
}

export default function AdminPlanosPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState([]);
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
      const res = await api.get('/admin/plans');
      const list = res?.data || res || [];
      setPlans((Array.isArray(list) ? list : []).map(normalizePlan));
    } catch (err) {
      showToast(err.message || 'Erro ao carregar planos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const unlimited = Number(form.limitSimulations) < 0;

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY);
    setFormOpen(true);
  };

  const openEdit = (plan) => {
    setEditingId(plan.id);
    setForm({
      ...splitPlanKey(plan.key),
      name: plan.name,
      price: plan.price,
      limitSimulations: plan.limitSimulations,
      permissions: plan.permissions,
    });
    setFormOpen(true);
  };

  const toggleUnlimited = () => {
    setForm((current) => ({
      ...current,
      limitSimulations:
        Number(current.limitSimulations) < 0 ? 10 : -1,
    }));
  };

  const toggleFeature = (featureKey) => {
    setForm((current) => {
      const selected = Array.isArray(current.permissions) ? current.permissions : [];
      const exists = selected.includes(featureKey);
      return {
        ...current,
        permissions: exists
          ? selected.filter((item) => item !== featureKey)
          : [...selected, featureKey],
      };
    });
  };

  const save = async () => {
    const payload = {
      key: buildPlanKey(form.keyBase, form.billingPeriod),
      name: form.name.trim(),
      price: Number(form.price) || 0,
      limitSimulations: unlimited ? -1 : Math.max(0, Number(form.limitSimulations) || 0),
      permissions: form.permissions || [],
    };
    if (!payload.key || !payload.name) {
      showToast('Informe key e nome.', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/admin/plans/${editingId}`, payload);
        showToast('Plano atualizado.');
      } else {
        await api.post('/admin/plans', payload);
        showToast('Plano criado.');
      }
      setFormOpen(false);
      load();
    } catch (err) {
      showToast(err.message || 'Erro ao salvar.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (plan) => {
    if (!window.confirm(`Excluir plano ${plan.name}?`)) return;
    try {
      await api.delete(`/admin/plans/${plan.id}`);
      showToast('Plano removido.');
      load();
    } catch (err) {
      showToast(err.message || 'Erro ao excluir.', 'error');
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
          <h1 className={styles.title}>Planos</h1>
          <p className={styles.subtitle}>
            Gerencie planos de assinatura, preço e limite de simulações.
          </p>
        </div>
        <Button type="button" variant="primary" onClick={openCreate}>
          Novo plano
        </Button>
      </header>

      <section className={styles.panel}>
        {plans.length === 0 ? (
          <p className={styles.empty}>Nenhum plano cadastrado.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Nome</th>
                  <th>Preço</th>
                  <th>Limite sims</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan.id}>
                    <td>
                      <strong>{plan.key}</strong>
                    </td>
                    <td>{plan.name}</td>
                    <td>
                      {Number(plan.price).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </td>
                    <td>
                      {plan.limitSimulations < 0
                        ? 'Ilimitado'
                        : plan.limitSimulations}
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => openEdit(plan)}
                        >
                          Editar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          onClick={() => remove(plan)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? 'Editar plano' : 'Novo plano'}
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
          <div className={styles.formRow}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Key</span>
              <input
                className={styles.input}
                value={form.keyBase}
                disabled={Boolean(editingId)}
                placeholder="standard"
                onChange={(e) => setForm((f) => ({ ...f, keyBase: e.target.value }))}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Nome</span>
              <input
                className={styles.input}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
          </div>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Cobrança</span>
            <select
              className={styles.select}
              value={form.billingPeriod}
              disabled={Boolean(editingId)}
              onChange={(e) =>
                setForm((f) => ({ ...f, billingPeriod: e.target.value }))
              }
            >
              {BILLING_PERIODS.map((period) => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
            <span className={styles.hint}>
              {editingId
                ? 'A key e a cobrança não podem ser alteradas depois de criado, porque as assinaturas existentes apontam para elas. Para oferecer o outro período, crie um plano novo com a mesma key.'
                : `Key final: ${buildPlanKey(form.keyBase, form.billingPeriod) || '—'}. Use a mesma key nos dois períodos (ex: "standard" em Mensal e em Anual) para que os dois apareçam no seletor da landing.`}
            </span>
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Preço</span>
            <input
              className={styles.input}
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            />
          </label>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Limite de simulações</span>
            <div className={styles.limitRow}>
              <input
                className={styles.input}
                type="number"
                min={0}
                disabled={unlimited}
                value={unlimited ? '' : form.limitSimulations}
                placeholder={unlimited ? 'Ilimitado' : 'Ex: 10'}
                onChange={(e) =>
                  setForm((f) => ({ ...f, limitSimulations: e.target.value }))
                }
              />
              <button
                type="button"
                className={`${styles.limitToggle} ${
                  unlimited ? styles.limitToggleActive : ''
                }`}
                onClick={toggleUnlimited}
              >
                Ilimitado
              </button>
            </div>
            <p className={styles.hint}>
              {unlimited
                ? 'Plano sem limite de simulações.'
                : 'Defina um número ou ative Ilimitado.'}
            </p>
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Funcionalidades liberadas</span>
            <div className={styles.checkGrid}>
              {FEATURE_OPTIONS.map((feature) => {
                const active = (form.permissions || []).includes(feature.key);
                return (
                  <button
                    key={feature.key}
                    type="button"
                    className={`${styles.checkItem} ${
                      active ? styles.checkItemActive : ''
                    }`}
                    onClick={() => toggleFeature(feature.key)}
                    aria-pressed={active}
                  >
                    <span className={styles.checkBox}>
                      {active ? <CheckIcon /> : null}
                    </span>
                    {feature.label}
                  </button>
                );
              })}
            </div>
            <span className={styles.hint}>
              O que estiver desmarcado fica bloqueado para o assinante e não aparece
              no card do plano. Painel, Perfil, Configurações e Planos são sempre
              liberados. O limite de simulações é o campo acima.
            </span>
          </div>
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
