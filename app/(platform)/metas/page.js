'use client';

import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/atoms/Button/Button';
import Spinner from '@/components/atoms/Spinner/Spinner';
import Toast from '@/components/molecules/Toast/Toast';
import Modal from '@/components/organisms/Modal/Modal';
import { api } from '@/lib/api';
import { pickField } from '@/lib/normalize';
import styles from './metas.module.css';

const TEMPLATES = [
  'Meta Consórcio',
  'Meta Seguro',
  'Meta Previdência',
  'Meta Investimentos',
];

const EMPTY_FORM = {
  label: '',
  target: 10,
  achieved: 0,
};

function normalizeGoal(raw = {}) {
  return {
    id: pickField(raw, 'id'),
    label: pickField(raw, 'label') || '',
    target: Number(pickField(raw, 'target') ?? 0) || 0,
    achieved: Number(pickField(raw, 'achieved') ?? 0) || 0,
  };
}

function pctOf(achieved, target) {
  if (!target || target <= 0) return 0;
  return Math.round((achieved / target) * 100);
}

function toneClass(pct) {
  if (pct >= 100) return styles.toneDone;
  if (pct >= 50) return styles.toneMid;
  return styles.toneLow;
}

function ProgressRing({ pct, size = 148, stroke = 10, className = '' }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(pct, 100) / 100) * circumference;

  return (
    <svg
      className={`${styles.ringSvg} ${className}`}
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      aria-hidden="true"
    >
      <circle
        className={styles.ringTrack}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={stroke}
      />
      <circle
        className={styles.ringValue}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

function MiniRing({ pct }) {
  const size = 52;
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(pct, 100) / 100) * circumference;
  const done = pct >= 100;

  return (
    <div className={styles.miniRing}>
      <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(242,244,247,0.12)"
          strokeWidth={stroke}
        />
        <circle
          className={done ? styles.miniFill : undefined}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={done ? '#6ee7a8' : '#f2f4f7'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span>{pct}%</span>
    </div>
  );
}

export default function MetasPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bumpingId, setBumpingId] = useState(null);
  const [goals, setGoals] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((current) => ({ ...current, visible: false })), 3500);
  };

  const loadGoals = async () => {
    try {
      const res = await api.get('/goals');
      const list = (res?.data || res || []).map(normalizeGoal);
      setGoals(list);
    } catch (err) {
      showToast(err.message || 'Não foi possível carregar as metas.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const totals = useMemo(() => {
    const target = goals.reduce((sum, goal) => sum + goal.target, 0);
    const achieved = goals.reduce((sum, goal) => sum + goal.achieved, 0);
    const pct = pctOf(achieved, target);
    const done = goals.filter((goal) => pctOf(goal.achieved, goal.target) >= 100).length;
    return { target, achieved, pct, done, count: goals.length };
  }, [goals]);

  const openNew = (label = '') => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      label: label || '',
      target: 10,
      achieved: 0,
    });
    setModalOpen(true);
  };

  const openEdit = (goal) => {
    setEditingId(goal.id);
    setForm({
      label: goal.label,
      target: goal.target,
      achieved: goal.achieved,
    });
    setModalOpen(true);
  };

  const saveGoal = async () => {
    if (!String(form.label).trim()) {
      showToast('Informe o nome da meta.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        label: String(form.label).trim(),
        target: Math.max(0, Number(form.target) || 0),
        achieved: Math.max(0, Number(form.achieved) || 0),
      };

      if (editingId) {
        await api.put(`/goals/${editingId}`, payload);
        showToast('Meta atualizada.');
      } else {
        await api.post('/goals', payload);
        showToast('Meta criada.');
      }
      setModalOpen(false);
      await loadGoals();
    } catch (err) {
      showToast(err.message || 'Não foi possível salvar a meta.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteGoal = async (goal) => {
    if (!window.confirm(`Excluir "${goal.label}"?`)) return;
    try {
      await api.delete(`/goals/${goal.id}`);
      setGoals((current) => current.filter((item) => item.id !== goal.id));
      showToast('Meta removida.');
    } catch (err) {
      showToast(err.message || 'Não foi possível excluir.', 'error');
    }
  };

  const bumpAchieved = async (goal, delta) => {
    const next = Math.max(0, goal.achieved + delta);
    setBumpingId(goal.id);
    try {
      await api.put(`/goals/${goal.id}`, { achieved: next });
      setGoals((current) =>
        current.map((item) =>
          item.id === goal.id ? { ...item, achieved: next } : item
        )
      );
    } catch (err) {
      showToast(err.message || 'Não foi possível atualizar.', 'error');
    } finally {
      setBumpingId(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner size="lg" />
      </div>
    );
  }

  const hasData = goals.length > 0;

  return (
    <div className={styles.page}>
      <section className={styles.banner}>
        <div className={styles.bannerLeft}>
          <div className={styles.bannerCopy}>
            <p className={styles.eyebrow}>Gestão</p>
            <h1 className={styles.title}>Controle de metas</h1>
            <p className={styles.subtitle}>
              Acompanhe produção por produto, avance no ritmo e feche o mês no alvo.
            </p>
          </div>

          <div className={styles.pocketStats}>
            <div className={styles.pocketStat}>
              <strong>{totals.count}</strong>
              <span>Metas</span>
            </div>
            <div className={styles.pocketStat}>
              <strong>{totals.achieved}</strong>
              <span>Realizado</span>
            </div>
            <div className={styles.pocketStat}>
              <strong>{totals.done}</strong>
              <span>Concluídas</span>
            </div>
          </div>
        </div>

        <div className={styles.bannerRight}>
          <div className={styles.ringWrap}>
            <ProgressRing pct={totals.pct} />
            <div className={styles.ringCenter}>
              <p className={styles.ringPct}>{totals.pct}%</p>
            </div>
            <p className={styles.ringLabel}>Geral</p>
          </div>
          <p className={styles.ringHint}>
            {totals.target > 0
              ? `${totals.achieved} de ${totals.target} no total das metas`
              : 'Defina metas para acompanhar o progresso'}
          </p>
        </div>
      </section>

      {hasData ? (
        <section className={styles.overall}>
          <div className={styles.overallTop}>
            <h2 className={styles.overallTitle}>Progresso geral</h2>
            <p className={styles.overallMeta}>
              {totals.achieved} / {totals.target} · {totals.pct}%
            </p>
          </div>
          <div className={styles.barTrack}>
            <div
              className={styles.barFill}
              style={{ width: `${Math.min(totals.pct, 100)}%` }}
            />
          </div>
        </section>
      ) : null}

      {!hasData ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon} aria-hidden="true">
            ◎
          </div>
          <h2 className={styles.emptyTitle}>Nenhuma meta ainda</h2>
          <p className={styles.emptyText}>
            Crie metas por produto e use +1 / +5 / +10 para registrar cada conquista no
            dia a dia.
          </p>
          <Button variant="primary" onClick={() => openNew()}>
            Criar primeira meta
          </Button>
          <div className={styles.templates}>
            {TEMPLATES.map((label) => (
              <button
                key={label}
                type="button"
                className={styles.templateChip}
                onClick={() => openNew(label)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.grid}>
          {goals.map((goal, index) => {
            const pct = pctOf(goal.achieved, goal.target);
            const wide = goals.length % 2 === 1 && index === 0;
            return (
              <article
                key={goal.id}
                className={`${styles.goalCard} ${wide ? styles.goalCardWide : ''} ${toneClass(pct)}`}
              >
                <div className={styles.goalTop}>
                  <div className={styles.goalIdentity}>
                    <MiniRing pct={pct} />
                    <div>
                      <h3 className={styles.goalName}>{goal.label}</h3>
                      <p className={styles.goalSub}>
                        {goal.achieved} realizados · meta {goal.target}
                      </p>
                    </div>
                  </div>
                  <div className={styles.goalActions}>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => openEdit(goal)}
                      aria-label="Editar meta"
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                      onClick={() => deleteGoal(goal)}
                      aria-label="Excluir meta"
                    >
                      ⌫
                    </button>
                  </div>
                </div>

                <div className={styles.goalBar}>
                  <div className={styles.goalBarMeta}>
                    <span>Progresso</span>
                    <strong>{pct}%</strong>
                  </div>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>

                <div className={styles.quickAdd}>
                  {[1, 5, 10].map((delta) => (
                    <button
                      key={delta}
                      type="button"
                      className={styles.quickBtn}
                      disabled={bumpingId === goal.id}
                      onClick={() => bumpAchieved(goal, delta)}
                    >
                      +{delta}
                    </button>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          if (!saving) setModalOpen(false);
        }}
        title={editingId ? 'Editar meta' : 'Nova meta'}
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button variant="primary" loading={saving} onClick={saveGoal}>
              Salvar
            </Button>
          </>
        }
      >
        <div className={styles.formGrid}>
          <div className={`${styles.formField} ${styles.formFull}`}>
            <label htmlFor="goal-label">Nome da meta</label>
            <input
              id="goal-label"
              value={form.label}
              onChange={(e) =>
                setForm((current) => ({ ...current, label: e.target.value }))
              }
              placeholder="Ex.: Meta Consórcio"
            />
          </div>
          <div className={styles.formField}>
            <label htmlFor="goal-target">Meta (alvo)</label>
            <input
              id="goal-target"
              type="number"
              min={0}
              value={form.target}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  target: Number(e.target.value),
                }))
              }
            />
          </div>
          <div className={styles.formField}>
            <label htmlFor="goal-achieved">Realizado</label>
            <input
              id="goal-achieved"
              type="number"
              min={0}
              value={form.achieved}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  achieved: Number(e.target.value),
                }))
              }
            />
          </div>
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
