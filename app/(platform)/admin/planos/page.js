'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/atoms/Button/Button';
import Spinner from '@/components/atoms/Spinner/Spinner';
import Toast from '@/components/molecules/Toast/Toast';
import Modal from '@/components/organisms/Modal/Modal';
import { api } from '@/lib/api';
import { pickField } from '@/lib/normalize';
import styles from '../admin.module.css';

// Períodos de cobrança. Mensal/Anual mantêm o sufixo na key (a landing agrupa os
// dois no mesmo seletor); Personalizado e Gratuito usam a key como digitada.
const BILLING_PERIODS = [
  { value: 'monthly', label: 'Mensal', suffix: '_monthly', days: 30 },
  { value: 'yearly', label: 'Anual', suffix: '_yearly', days: 365 },
  { value: 'custom', label: 'Personalizado', suffix: '', days: null },
  { value: 'free', label: 'Gratuito', suffix: '', days: 365 },
];

// Funcionalidades com limite numérico de uso por ciclo (as demais são só
// liga/desliga por permissão — limitar visualização travaria o usuário).
const LIMITABLE = ['cenarios', 'copiloto', 'gerador', 'analise_audio', 'carteira', 'metas', 'anotacoes', 'whatsapp_copilot'];

const periodMeta = (value) => BILLING_PERIODS.find((p) => p.value === value) || BILLING_PERIODS[0];

function buildPlanKey(keyBase, billingPeriod) {
  const base = String(keyBase).trim().toLowerCase().replace(/\s+/g, '_').replace(/_(monthly|yearly)$/, '');
  if (!base) return '';
  const suffix = periodMeta(billingPeriod).suffix;
  return `${base}${suffix}`;
}

function keyBaseFrom(key = '') {
  return String(key).replace(/_(monthly|yearly)$/, '');
}

const EMPTY = {
  keyBase: '',
  billingPeriod: 'monthly',
  durationDays: 30,
  isFree: false,
  name: '',
  price: 0,
  permissions: [],
  limits: {}, // { featureKey: number } — -1 ilimitado
};

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12.5 10 17l9-11" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function normalizePlan(raw = {}) {
  return {
    id: pickField(raw, 'id'),
    key: pickField(raw, 'key') || '',
    name: pickField(raw, 'name') || '',
    price: Number(pickField(raw, 'price') ?? 0),
    billingPeriod: pickField(raw, 'billingPeriod', 'billing_period') || 'monthly',
    durationDays: Number(pickField(raw, 'durationDays', 'duration_days') ?? 30),
    isFree: Boolean(pickField(raw, 'isFree', 'is_free')),
    limitSimulations: Number(pickField(raw, 'limitSimulations', 'limit_simulations') ?? 10),
    limits: raw.limits && typeof raw.limits === 'object' ? raw.limits : {},
    permissions: Array.isArray(raw.permissions) ? raw.permissions : [],
  };
}

const PERIOD_LABEL = { monthly: 'Mensal', yearly: 'Anual', custom: 'Personalizado', free: 'Gratuito' };

export default function AdminPlanosPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState([]);
  const [featureOptions, setFeatureOptions] = useState([]);
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

  const loadFeatures = async () => {
    try {
      const res = await api.get('/admin/plans/features');
      const list = res?.data || res || [];
      setFeatureOptions(Array.isArray(list) ? list : []);
    } catch (err) {
      showToast(err.message || 'Erro ao carregar as funcionalidades.', 'error');
    }
  };

  useEffect(() => {
    load();
    loadFeatures();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY);
    setFormOpen(true);
  };

  const openEdit = (plan) => {
    setEditingId(plan.id);
    // limits parte do plano; garante a chave 'cenarios' vinda do limitSimulations legado.
    const limits = { ...plan.limits };
    if (limits.cenarios === undefined && plan.limitSimulations !== undefined) {
      limits.cenarios = plan.limitSimulations;
    }
    setForm({
      keyBase: keyBaseFrom(plan.key),
      billingPeriod: plan.billingPeriod || 'monthly',
      durationDays: plan.durationDays || 30,
      isFree: Boolean(plan.isFree) || plan.billingPeriod === 'free',
      name: plan.name,
      price: plan.price,
      permissions: plan.permissions,
      limits,
    });
    setFormOpen(true);
  };

  const setPeriod = (value) => {
    setForm((f) => {
      const meta = periodMeta(value);
      return {
        ...f,
        billingPeriod: value,
        isFree: value === 'free',
        price: value === 'free' ? 0 : f.price,
        durationDays: meta.days ?? (f.durationDays || 30),
      };
    });
  };

  const toggleFeature = (featureKey) => {
    setForm((current) => {
      const selected = Array.isArray(current.permissions) ? current.permissions : [];
      const exists = selected.includes(featureKey);
      return {
        ...current,
        permissions: exists ? selected.filter((i) => i !== featureKey) : [...selected, featureKey],
      };
    });
  };

  // Limite por funcionalidade: -1 = ilimitado (ou ausente).
  const getLimit = (key) => {
    const v = form.limits?.[key];
    return v === undefined || v === null ? -1 : Number(v);
  };
  const setLimit = (key, value) => {
    setForm((f) => ({ ...f, limits: { ...f.limits, [key]: value } }));
  };
  const toggleUnlimited = (key) => {
    setForm((f) => {
      const cur = f.limits?.[key];
      const isUnlimited = cur === undefined || cur === null || Number(cur) < 0;
      return { ...f, limits: { ...f.limits, [key]: isUnlimited ? 10 : -1 } };
    });
  };

  const save = async () => {
    const key = buildPlanKey(form.keyBase, form.billingPeriod);
    if (!key || !form.name.trim()) {
      showToast('Informe key e nome.', 'error');
      return;
    }
    if (form.billingPeriod === 'custom' && (!Number(form.durationDays) || Number(form.durationDays) <= 0)) {
      showToast('No período personalizado, informe o prazo em dias.', 'error');
      return;
    }

    // Monta limits só das funcionalidades liberadas e limitáveis.
    const limits = {};
    for (const k of LIMITABLE) {
      if ((form.permissions || []).includes(k)) {
        const v = getLimit(k);
        limits[k] = Number.isFinite(v) ? v : -1;
      }
    }

    const payload = {
      key,
      name: form.name.trim(),
      price: form.isFree ? 0 : Number(form.price) || 0,
      billingPeriod: form.billingPeriod,
      durationDays: Number(form.durationDays) || periodMeta(form.billingPeriod).days || 30,
      isFree: form.billingPeriod === 'free' || form.isFree,
      permissions: form.permissions || [],
      limits,
      // Mantém o rótulo "X Simulações" do card coerente com o limite de cenários.
      limitSimulations: limits.cenarios !== undefined ? limits.cenarios : -1,
    };

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
    return <div className={styles.loading}><Spinner size="lg" /></div>;
  }

  const enabledLimitable = LIMITABLE
    .map((k) => featureOptions.find((f) => f.key === k))
    .filter((f) => f && (form.permissions || []).includes(f.key));

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Administração</p>
          <h1 className={styles.title}>Planos</h1>
          <p className={styles.subtitle}>
            Preço, período (mensal, anual, personalizado ou gratuito) e limite de uso de cada funcionalidade.
          </p>
        </div>
        <Button type="button" variant="primary" onClick={openCreate}>Novo plano</Button>
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
                  <th>Período</th>
                  <th>Preço</th>
                  <th>Limite cenários</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan.id}>
                    <td><strong>{plan.key}</strong></td>
                    <td>{plan.name}</td>
                    <td>
                      {PERIOD_LABEL[plan.billingPeriod] || plan.billingPeriod}
                      {plan.billingPeriod === 'custom' ? ` (${plan.durationDays}d)` : ''}
                    </td>
                    <td>
                      {plan.isFree
                        ? 'Grátis'
                        : Number(plan.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td>
                      {(plan.limits?.cenarios ?? plan.limitSimulations) < 0 ? 'Ilimitado' : (plan.limits?.cenarios ?? plan.limitSimulations)}
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <Button type="button" size="sm" variant="secondary" onClick={() => openEdit(plan)}>Editar</Button>
                        <Button type="button" size="sm" variant="danger" onClick={() => remove(plan)}>Excluir</Button>
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
            <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button type="button" variant="primary" onClick={save} disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</Button>
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

          <div className={styles.formRow}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Cobrança</span>
              <select
                className={styles.select}
                value={form.billingPeriod}
                disabled={Boolean(editingId)}
                onChange={(e) => setPeriod(e.target.value)}
              >
                {BILLING_PERIODS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </label>
            {form.billingPeriod === 'custom' && (
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Prazo (dias)</span>
                <input
                  className={styles.input}
                  type="number"
                  min={1}
                  value={form.durationDays}
                  placeholder="Ex: 90"
                  onChange={(e) => setForm((f) => ({ ...f, durationDays: e.target.value }))}
                />
              </label>
            )}
          </div>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Preço</span>
            <input
              className={styles.input}
              type="number"
              step="0.01"
              value={form.isFree ? 0 : form.price}
              disabled={form.isFree}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            />
            <span className={styles.hint}>
              {form.isFree
                ? 'Plano gratuito — o preço fica em R$ 0,00.'
                : editingId
                  ? 'A key e o período não podem mudar (assinaturas apontam para eles).'
                  : `Key final: ${buildPlanKey(form.keyBase, form.billingPeriod) || '—'}.`}
            </span>
          </label>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>Funcionalidades liberadas</span>
            <div className={styles.checkGrid}>
              {featureOptions.map((feature) => {
                const active = (form.permissions || []).includes(feature.key);
                return (
                  <button
                    key={feature.key}
                    type="button"
                    className={`${styles.checkItem} ${active ? styles.checkItemActive : ''}`}
                    onClick={() => toggleFeature(feature.key)}
                    aria-pressed={active}
                  >
                    <span className={styles.checkBox}>{active ? <CheckIcon /> : null}</span>
                    {feature.label}
                  </button>
                );
              })}
            </div>
            <span className={styles.hint}>
              Desmarcado = bloqueado para o assinante. Painel, Perfil, Configurações e Planos são sempre liberados.
            </span>
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>Limite de uso por ciclo</span>
            {enabledLimitable.length === 0 ? (
              <p className={styles.hint}>Ative uma funcionalidade acima (Cenários, Copiloto, Gerador, Análise de Áudio, Carteira, Metas, Anotações ou WhatsApp) para definir o limite dela.</p>
            ) : (
              <div className={styles.formGrid} style={{ gap: 8 }}>
                {enabledLimitable.map((feature) => {
                  const unlimited = getLimit(feature.key) < 0;
                  return (
                    <div key={feature.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ flex: 1, fontSize: 13 }}>{feature.label}</span>
                      <input
                        className={styles.input}
                        style={{ width: 110 }}
                        type="number"
                        min={0}
                        disabled={unlimited}
                        value={unlimited ? '' : getLimit(feature.key)}
                        placeholder={unlimited ? 'Ilimitado' : 'Ex: 10'}
                        onChange={(e) => setLimit(feature.key, Math.max(0, Number(e.target.value) || 0))}
                      />
                      <button
                        type="button"
                        className={`${styles.limitToggle} ${unlimited ? styles.limitToggleActive : ''}`}
                        onClick={() => toggleUnlimited(feature.key)}
                      >
                        Ilimitado
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            <span className={styles.hint}>
              O teto vale por ciclo do plano ({form.billingPeriod === 'custom' ? `${form.durationDays || 0} dias` : periodMeta(form.billingPeriod).days + ' dias'}). Ao atingir, o assinante é convidado a fazer upgrade.
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
