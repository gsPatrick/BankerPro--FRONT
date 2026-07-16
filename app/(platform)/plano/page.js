'use client';

import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/atoms/Button/Button';
import Badge from '@/components/atoms/Badge/Badge';
import Spinner from '@/components/atoms/Spinner/Spinner';
import Toast from '@/components/molecules/Toast/Toast';
import Modal from '@/components/organisms/Modal/Modal';
import PaymentCheckout from '@/components/organisms/PaymentCheckout/PaymentCheckout';
import { api } from '@/lib/api';
import {
  comparePlanAction,
  formatPlanPrice,
  isFreePlan,
  normalizePlan,
} from '@/lib/plans';
import styles from './plano.module.css';

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR');
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

function formatPaymentMethod(method) {
  const key = String(method || '').toLowerCase();
  if (key === 'credit_card' || key === 'card') return 'Cartão de crédito';
  if (key === 'pix') return 'PIX';
  if (key === 'free') return 'Gratuito';
  return method || '—';
}

function formatStatus(status) {
  const key = String(status || '').toLowerCase();
  if (key === 'active') return 'Ativo';
  if (key === 'cancelled' || key === 'canceled') return 'Cancelado';
  if (key === 'expired') return 'Expirado';
  return status || '—';
}

export default function PlanoPage() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [plans, setPlans] = useState([]);
  const [history, setHistory] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [me, setMe] = useState(null);
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((current) => ({ ...current, visible: false })), 3500);
  };

  const load = async () => {
    try {
      const [plansRes, subRes, meRes, historyRes] = await Promise.all([
        api.get('/subscription/plans'),
        api.get('/subscription/current').catch(() => null),
        api.get('/auth/me').catch(() => null),
        api.get('/subscription/history').catch(() => null),
      ]);

      const list = (plansRes?.data || plansRes || []).map(normalizePlan).filter(Boolean);
      setPlans(list);
      setSubscription(subRes?.data || subRes || null);
      setMe(meRes?.data || meRes || null);
      setHistory(historyRes?.data || historyRes || []);
    } catch (err) {
      showToast(err.message || 'Não foi possível carregar os planos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const currentPlanKey = useMemo(() => {
    const local =
      typeof window !== 'undefined'
        ? localStorage.getItem('bankerpro_plan_selected')
        : null;
    return subscription?.plan || me?.plan || local || 'free';
  }, [subscription, me]);

  const currentPlan = useMemo(() => {
    return plans.find((plan) => plan.key === currentPlanKey) || normalizePlan({
      key: currentPlanKey,
      name: String(currentPlanKey).toUpperCase(),
      price: currentPlanKey === 'free' ? 0 : null,
      features: [],
    });
  }, [plans, currentPlanKey]);

  const planNameByKey = useMemo(() => {
    const map = {};
    plans.forEach((plan) => {
      map[plan.key] = plan.name;
    });
    return map;
  }, [plans]);

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const raw = item.createdAt || item.startsAt;
      if (!raw) return !dateFrom && !dateTo;
      const day = new Date(raw);
      if (Number.isNaN(day.getTime())) return true;

      if (dateFrom) {
        const from = new Date(`${dateFrom}T00:00:00`);
        if (day < from) return false;
      }
      if (dateTo) {
        const to = new Date(`${dateTo}T23:59:59`);
        if (day > to) return false;
      }
      return true;
    });
  }, [history, dateFrom, dateTo]);

  const isCurrentFree = isFreePlan(currentPlan);
  const statusLabel = subscription?.status === 'active'
    ? 'Ativo'
    : subscription?.planSelected
      ? 'Ativo'
      : 'Sem plano ativo';

  const activateFree = async (planKey = 'free') => {
    setActionLoading(planKey);
    try {
      await api.post('/subscription/checkout', {
        planType: planKey,
        paymentMethod: 'free',
      });
      localStorage.setItem('bankerpro_plan_selected', planKey);
      showToast('Plano atualizado com sucesso.');
      setConfirmAction(null);
      setLoading(true);
      await load();
    } catch (err) {
      const legacy =
        /planos?\s+gratuitos?\s+n[aã]o\s+exigem\s+checkout/i.test(err.message || '');
      if (legacy) {
        localStorage.setItem('bankerpro_plan_selected', planKey);
        showToast('Plano gratuito ativado.');
        setConfirmAction(null);
        setLoading(true);
        await load();
        return;
      }
      showToast(err.message || 'Não foi possível atualizar o plano.', 'error');
    } finally {
      setActionLoading('');
    }
  };

  const handlePlanClick = (plan) => {
    const action = comparePlanAction(currentPlan, plan);
    if (action === 'current') return;

    if (isFreePlan(plan)) {
      setConfirmAction({
        type: !isCurrentFree ? 'switch' : 'activate',
        plan,
      });
      return;
    }

    setCheckoutPlan(plan);
  };

  const confirmCopy = useMemo(() => {
    if (!confirmAction?.plan) return null;
    if (confirmAction.type === 'cancel') {
      return {
        title: 'Cancelar assinatura',
        body: 'Sua assinatura será encerrada e você voltará ao plano gratuito. Recursos pagos deixam de ficar disponíveis.',
        confirmLabel: 'Confirmar cancelamento',
      };
    }
    return {
      title: `Trocar para ${confirmAction.plan.name}`,
      body: 'Confirme para trocar o plano da sua conta.',
      confirmLabel: 'Confirmar troca',
    };
  }, [confirmAction]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroMain}>
          <p className={styles.eyebrow}>Assinatura</p>
          <h2 className={styles.title}>Seu plano</h2>
          <p className={styles.subtitle}>
            Compare opções, troque de plano ou cancele quando quiser.
          </p>
          <div className={styles.heroBadges}>
            <Badge variant="accent">{currentPlan?.name || currentPlanKey}</Badge>
            <Badge variant={subscription?.status === 'active' || subscription?.planSelected ? 'success' : 'warning'}>
              {statusLabel}
            </Badge>
            <Badge variant="gold">{formatPlanPrice(currentPlan?.price)}</Badge>
          </div>
        </div>

        <div className={styles.heroMeta}>
          <div className={styles.metaItem}>
            <span>Início</span>
            <strong>{formatDate(subscription?.startsAt || subscription?.starts_at)}</strong>
          </div>
          <div className={styles.metaItem}>
            <span>Renovação / fim</span>
            <strong>{formatDate(subscription?.endsAt || subscription?.ends_at) === '—' ? 'Recorrente' : formatDate(subscription?.endsAt || subscription?.ends_at)}</strong>
          </div>
          <div className={styles.metaItem}>
            <span>Simulações</span>
            <strong>
              {currentPlan?.limitSimulations == null
                ? '—'
                : currentPlan.limitSimulations < 0
                  ? 'Ilimitado'
                  : currentPlan.limitSimulations}
            </strong>
          </div>
        </div>
      </section>

      {!isCurrentFree && (
        <section className={styles.actionsRow}>
          <button
            type="button"
            className={styles.actionTile}
            onClick={() => setConfirmAction({
              type: 'cancel',
              plan: plans.find(isFreePlan) || normalizePlan({ key: 'free', name: 'Gratuito', price: 0 }),
            })}
          >
            <span className={styles.actionTitle}>Cancelar assinatura</span>
            <span className={styles.actionDesc}>Voltar para o plano gratuito</span>
          </button>
        </section>
      )}

      <section className={styles.plansGrid} aria-label="Planos disponíveis">
        {plans.map((plan) => {
          const action = comparePlanAction(currentPlan, plan);
          const isCurrent = action === 'current';
          const free = isFreePlan(plan);
          const cta = isCurrent ? 'Plano atual' : 'Trocar plano';

          return (
            <article
              key={plan.key || plan.id}
              className={[
                styles.planCard,
                isCurrent ? styles.planCardCurrent : '',
                !free ? styles.planCardPaid : '',
              ].filter(Boolean).join(' ')}
            >
              <div className={styles.planTop}>
                <div>
                  <h3 className={styles.planName}>{plan.name}</h3>
                  {isCurrent && <Badge variant="success" size="sm">Atual</Badge>}
                </div>
                <p className={styles.planPrice}>
                  {formatPlanPrice(plan.price)}
                  {!free && <span>/mês</span>}
                </p>
              </div>

              <p className={styles.planLimit}>
                {plan.limitSimulations == null
                  ? 'Limite conforme plano'
                  : plan.limitSimulations < 0
                    ? 'Simulações ilimitadas'
                    : `${plan.limitSimulations} simulações`}
              </p>

              <ul className={styles.featureList}>
                {(plan.features?.length
                  ? plan.features
                  : [
                      free ? 'Acesso essencial' : 'Recursos avançados',
                      free ? 'Ideal para começar' : 'Prioridade na plataforma',
                    ]
                ).slice(0, 6).map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>

              <div className={styles.planCta}>
                <Button
                  variant={isCurrent ? 'secondary' : 'primary'}
                  size="lg"
                  className={[styles.planBtn, !isCurrent ? styles.solidCta : ''].filter(Boolean).join(' ')}
                  disabled={isCurrent || Boolean(actionLoading)}
                  loading={actionLoading === plan.key}
                  onClick={() => handlePlanClick(plan)}
                >
                  {cta}
                </Button>
              </div>
            </article>
          );
        })}
      </section>

      <section className={styles.historySection}>
        <header className={styles.historyHeader}>
          <div>
            <h3 className={styles.historyTitle}>Histórico de assinaturas</h3>
            <p className={styles.historyDesc}>
              Todas as vezes em que você ativou ou trocou de plano.
            </p>
          </div>

          <div className={styles.historyFilters}>
            <div className={styles.filterField}>
              <label htmlFor="history-from">De</label>
              <input
                id="history-from"
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className={styles.filterField}>
              <label htmlFor="history-to">Até</label>
              <input
                id="history-to"
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            {(dateFrom || dateTo) && (
              <button
                type="button"
                className={styles.clearFilter}
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                }}
              >
                Limpar
              </button>
            )}
          </div>
        </header>

        {filteredHistory.length === 0 ? (
          <div className={styles.historyEmpty}>
            {history.length === 0
              ? 'Ainda não há registros de assinatura nesta conta.'
              : 'Nenhum registro no período selecionado.'}
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Plano</th>
                  <th>Status</th>
                  <th>Pagamento</th>
                  <th>Início</th>
                  <th>Fim</th>
                  <th>Registrado em</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{planNameByKey[item.plan] || item.plan}</strong>
                    </td>
                    <td>
                      <span
                        className={[
                          styles.statusPill,
                          item.status === 'active' ? styles.statusActive : styles.statusMuted,
                        ].join(' ')}
                      >
                        {formatStatus(item.status)}
                      </span>
                    </td>
                    <td>{formatPaymentMethod(item.paymentMethod)}</td>
                    <td>{formatDate(item.startsAt)}</td>
                    <td>{formatDate(item.endsAt)}</td>
                    <td>{formatDateTime(item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <PaymentCheckout
        isOpen={Boolean(checkoutPlan)}
        plan={checkoutPlan}
        onClose={() => setCheckoutPlan(null)}
        onSuccess={async () => {
          if (checkoutPlan?.key) {
            localStorage.setItem('bankerpro_plan_selected', checkoutPlan.key);
          }
          setCheckoutPlan(null);
          showToast('Pagamento confirmado. Plano atualizado!');
          setLoading(true);
          await load();
        }}
        onError={(message) => showToast(message, 'error')}
      />

      <Modal
        isOpen={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        title={confirmCopy?.title || 'Confirmar'}
        footer={(
          <>
            <Button variant="ghost" onClick={() => setConfirmAction(null)}>
              Voltar
            </Button>
            <Button
              variant={confirmAction?.type === 'cancel' ? 'danger' : 'primary'}
              className={confirmAction?.type === 'cancel' ? undefined : styles.solidCta}
              loading={Boolean(actionLoading)}
              onClick={() => activateFree(confirmAction?.plan?.key || 'free')}
            >
              {confirmCopy?.confirmLabel || 'Confirmar'}
            </Button>
          </>
        )}
      >
        <p className={styles.confirmText}>{confirmCopy?.body}</p>
      </Modal>

      {toast.visible && (
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast((current) => ({ ...current, visible: false }))}
        />
      )}
    </div>
  );
}
