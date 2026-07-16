'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/atoms/Button/Button';
import Spinner from '@/components/atoms/Spinner/Spinner';
import Toast from '@/components/molecules/Toast/Toast';
import Modal from '@/components/organisms/Modal/Modal';
import { api } from '@/lib/api';
import { pickField } from '@/lib/normalize';
import styles from '../admin.module.css';

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR');
}

function pickSubscription(subs = []) {
  if (!Array.isArray(subs) || subs.length === 0) return null;
  const active = subs.find(
    (item) => String(pickField(item, 'status') || '').toLowerCase() === 'active'
  );
  return active || subs[0];
}

function paymentLabel(sub) {
  if (!sub) {
    return { label: 'Sem plano', tone: '' };
  }

  const plan = String(pickField(sub, 'plan') || '').toLowerCase();
  const status = String(pickField(sub, 'status') || '').toLowerCase();
  const mpId = pickField(sub, 'mpSubscriptionId', 'mp_subscription_id') || '';
  const method = pickField(sub, 'paymentMethod', 'payment_method') || '';
  const endsAt = pickField(sub, 'endsAt', 'ends_at');
  const expired =
    endsAt && !Number.isNaN(new Date(endsAt).getTime())
      ? new Date(endsAt).getTime() < Date.now()
      : false;

  if (status === 'cancelled') {
    return { label: 'Cancelado', tone: 'off' };
  }
  if (status === 'expired' || expired) {
    return { label: 'Vencido', tone: 'off' };
  }
  if (plan === 'free') {
    return { label: 'Gratuito', tone: '' };
  }
  if (mpId === 'MANUAL_BY_ADMIN' || method === 'manual' || method === 'admin') {
    return { label: 'Cortesia', tone: '' };
  }
  if (mpId || method) {
    return { label: 'Pago', tone: 'ok' };
  }
  return { label: 'Pendente', tone: 'off' };
}

function normalizeUser(raw = {}) {
  const subs = Array.isArray(raw.subscriptions) ? raw.subscriptions : [];
  const active = pickSubscription(subs);
  const planDetails = active?.planDetails || active?.plan_details || null;
  const payment = paymentLabel(active);
  const endsAt = pickField(active, 'endsAt', 'ends_at');
  const startsAt = pickField(active, 'startsAt', 'starts_at');
  const expired =
    endsAt && !Number.isNaN(new Date(endsAt).getTime())
      ? new Date(endsAt).getTime() < Date.now()
      : false;

  return {
    id: pickField(raw, 'id'),
    email: pickField(raw, 'email') || '',
    role: pickField(raw, 'role') || 'user',
    isActive: Boolean(pickField(raw, 'isActive', 'is_active') ?? true),
    fullName:
      pickField(raw.profile, 'fullName', 'full_name') ||
      pickField(raw, 'fullName', 'full_name') ||
      '',
    planKey: pickField(active, 'plan') || '',
    planName:
      pickField(planDetails, 'name') ||
      pickField(active, 'plan') ||
      'Sem plano',
    planStatus: pickField(active, 'status') || '',
    paymentLabel: payment.label,
    paymentTone: payment.tone,
    startsAt,
    endsAt,
    expired,
    paymentMethod: pickField(active, 'paymentMethod', 'payment_method') || '',
  };
}

export default function AdminUsuariosPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [modal, setModal] = useState(null);
  const [planKey, setPlanKey] = useState('');
  const [days, setDays] = useState(30);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((c) => ({ ...c, visible: false })), 3500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      const list = res?.data || res || [];
      setUsers((Array.isArray(list) ? list : []).map(normalizeUser));
    } catch (err) {
      showToast(err.message || 'Erro ao carregar usuários.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadPlans = async () => {
    try {
      const res = await api.get('/admin/plans');
      const list = res?.data || res || [];
      setPlans(
        (Array.isArray(list) ? list : []).map((raw) => ({
          key: pickField(raw, 'key') || '',
          name: pickField(raw, 'name') || '',
        }))
      );
    } catch (err) {
      showToast(err.message || 'Erro ao carregar planos.', 'error');
    }
  };

  useEffect(() => {
    load();
    loadPlans();
  }, []);

  const toggleStatus = async (user) => {
    try {
      await api.put(`/admin/users/${user.id}/status`, { isActive: !user.isActive });
      const nextActive = !user.isActive;
      setUsers((list) =>
        list.map((item) =>
          item.id === user.id ? { ...item, isActive: nextActive } : item
        )
      );
      setModal((current) =>
        current?.user?.id === user.id
          ? { ...current, user: { ...current.user, isActive: nextActive } }
          : current
      );
      showToast(user.isActive ? 'Usuário desativado.' : 'Usuário ativado.');
    } catch (err) {
      showToast(err.message || 'Erro ao alterar status.', 'error');
    }
  };

  const changeRole = async (user, role) => {
    try {
      await api.put(`/admin/users/${user.id}/role`, { role });
      setUsers((list) =>
        list.map((item) => (item.id === user.id ? { ...item, role } : item))
      );
      setModal(null);
      showToast('Função atualizada.');
    } catch (err) {
      showToast(err.message || 'Erro ao alterar função.', 'error');
    }
  };

  const grantPlan = async () => {
    if (!modal?.user) return;
    if (!planKey) {
      showToast('Selecione um plano.', 'error');
      return;
    }
    try {
      await api.post(`/admin/users/${modal.user.id}/subscription`, {
        planKey,
        durationDays: Number(days) || 30,
      });
      setModal(null);
      showToast('Plano concedido.');
      load();
    } catch (err) {
      showToast(err.message || 'Erro ao conceder plano.', 'error');
    }
  };

  const removeUser = async (user) => {
    if (!window.confirm(`Excluir ${user.email}?`)) return;
    try {
      await api.delete(`/admin/users/${user.id}`);
      setUsers((list) => list.filter((item) => item.id !== user.id));
      showToast('Usuário removido.');
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
          <h1 className={styles.title}>Usuários</h1>
          <p className={styles.subtitle}>
            Ative, altere função, conceda plano ou remova contas da plataforma.
          </p>
        </div>
      </header>

      <section className={styles.panel}>
        {users.length === 0 ? (
          <p className={styles.empty}>Nenhum usuário encontrado.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Função</th>
                  <th>Conta</th>
                  <th>Plano</th>
                  <th>Pagamento</th>
                  <th>Vencimento</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.fullName || '—'}</strong>
                      <div>{user.email}</div>
                    </td>
                    <td>
                      <span className={styles.badge}>
                        {user.role === 'admin' ? 'Admin' : 'Usuário'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          user.isActive ? styles.badgeOk : styles.badgeOff
                        }`}
                      >
                        {user.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.planCell}>
                        <strong>{user.planName}</strong>
                        <span className={styles.planMeta}>
                          {user.planKey ? `key: ${user.planKey}` : 'Nenhuma assinatura'}
                          {user.planStatus ? ` · ${user.planStatus}` : ''}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          user.paymentTone === 'ok'
                            ? styles.badgeOk
                            : user.paymentTone === 'off'
                              ? styles.badgeOff
                              : ''
                        }`}
                      >
                        {user.paymentLabel}
                      </span>
                      {user.paymentMethod ? (
                        <div className={styles.planMeta}>{user.paymentMethod}</div>
                      ) : null}
                    </td>
                    <td>
                      <div className={styles.planCell}>
                        <strong>{formatDate(user.endsAt)}</strong>
                        <span className={styles.planMeta}>
                          {user.expired
                            ? 'Expirado'
                            : user.startsAt
                              ? `Início ${formatDate(user.startsAt)}`
                              : '—'}
                        </span>
                      </div>
                    </td>
                    <td className={styles.actionsCol}>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => setModal({ type: 'manage', user })}
                      >
                        Gerenciar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        isOpen={modal?.type === 'manage'}
        onClose={() => setModal(null)}
        title="Gerenciar usuário"
        footer={
          <Button type="button" variant="ghost" onClick={() => setModal(null)}>
            Fechar
          </Button>
        }
      >
        {modal?.user ? (
          <div className={styles.formGrid}>
            <div className={styles.planCell}>
              <strong>{modal.user.fullName || '—'}</strong>
              <span className={styles.planMeta}>{modal.user.email}</span>
              <span className={styles.planMeta}>
                {modal.user.planName} · {modal.user.paymentLabel} · venc.{' '}
                {formatDate(modal.user.endsAt)}
              </span>
            </div>
            <div className={styles.manageList}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => toggleStatus(modal.user)}
              >
                {modal.user.isActive ? 'Desativar conta' : 'Ativar conta'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setModal({ type: 'role', user: modal.user })}
              >
                Alterar função
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  const current = plans.find((plan) => plan.key === modal.user.planKey);
                  setPlanKey(current?.key || plans[0]?.key || '');
                  setDays(30);
                  setModal({ type: 'plan', user: modal.user });
                }}
              >
                Conceder / alterar plano
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={() => removeUser(modal.user)}
              >
                Excluir usuário
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={modal?.type === 'role'}
        onClose={() => setModal(null)}
        title="Alterar função"
        footer={
          <Button type="button" variant="ghost" onClick={() => setModal(null)}>
            Fechar
          </Button>
        }
      >
        <div className={styles.manageList}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => changeRole(modal.user, 'user')}
          >
            Definir como Usuário
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => changeRole(modal.user, 'admin')}
          >
            Definir como Administrador
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={modal?.type === 'plan'}
        onClose={() => setModal(null)}
        title="Conceder plano"
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setModal(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" onClick={grantPlan}>
              Conceder
            </Button>
          </>
        }
      >
        <div className={styles.formGrid}>
          {modal?.user ? (
            <p className={styles.hint}>
              {modal.user.email} · plano atual: {modal.user.planName} · venc.{' '}
              {formatDate(modal.user.endsAt)}
            </p>
          ) : null}
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Plano</span>
            <select
              className={styles.select}
              value={planKey}
              onChange={(e) => setPlanKey(e.target.value)}
            >
              {plans.length === 0 ? (
                <option value="">Nenhum plano cadastrado</option>
              ) : (
                plans.map((plan) => (
                  <option key={plan.key} value={plan.key}>
                    {plan.name || plan.key}
                  </option>
                ))
              )}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Dias de validade</span>
            <input
              className={styles.input}
              type="number"
              min={1}
              value={days}
              onChange={(e) => setDays(e.target.value)}
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
