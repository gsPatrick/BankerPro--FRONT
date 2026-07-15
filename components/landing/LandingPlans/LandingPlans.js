'use client';

import { useEffect, useState } from 'react';
import Spinner from '@/components/atoms/Spinner/Spinner';
import { api } from '@/lib/api';
import styles from './LandingPlans.module.css';

function parsePlanPrice(price) {
  if (price === null || price === undefined || price === '') return null;
  if (typeof price === 'number') return Number.isFinite(price) ? price : null;
  const value = Number(String(price).trim().replace(',', '.'));
  return Number.isFinite(value) ? value : null;
}

function formatPlanPrice(price) {
  const value = parsePlanPrice(price);
  if (value === null || value <= 0) {
    return { label: 'Grátis', period: '', currency: '' };
  }
  const formatted = Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace('.', ',');
  return { label: formatted, period: '/mês', currency: 'R$' };
}

function isFreePlan(plan) {
  if (!plan) return false;
  const key = String(plan.key || '').toLowerCase();
  if (key === 'free' || key === 'gratis' || key === 'gratuito') return true;
  const value = parsePlanPrice(plan.price);
  return value !== null && value <= 0;
}

function normalizePlan(plan) {
  return {
    id: plan.id,
    key: plan.key,
    name: plan.name,
    price: plan.price,
    limitSimulations: plan.limit_simulations ?? plan.limitSimulations,
    features: Array.isArray(plan.features) ? plan.features : [],
  };
}

export default function LandingPlans({ onSelectPlan }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const response = await api.get('/subscription/plans');
        if (!active) return;
        const list = Array.isArray(response?.data)
          ? response.data.map(normalizePlan)
          : Array.isArray(response)
            ? response.map(normalizePlan)
            : [];
        setPlans(list);
      } catch {
        if (active) setPlans([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const handleSelect = (plan) => {
    if (typeof window !== 'undefined' && plan?.key) {
      localStorage.setItem('bankerpro_plan_selected', plan.key);
    }
    onSelectPlan?.(plan);
  };

  return (
    <section className={styles.section} id="planos">
      <div className={styles.statementWrap}>
        <p className={styles.statement}>
          Fechar deixa de ser sorte quando o time treina com Closer.IA.
        </p>
      </div>

      <div className={styles.plansBlock}>
        <div className={styles.plansHead}>
          <p className={styles.eyebrow}>Planos</p>
          <h2 className={styles.plansTitle}>Escolha o ritmo da sua performance.</h2>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <Spinner size="md" />
          </div>
        ) : plans.length === 0 ? (
          <p className={styles.empty}>Nenhum plano disponível no momento.</p>
        ) : (
          <div className={styles.grid}>
            {plans.map((plan) => {
              const price = formatPlanPrice(plan.price);
              const free = isFreePlan(plan);
              const recommended = String(plan.key).toLowerCase() === 'pro';

              return (
                <article
                  key={plan.id || plan.key}
                  className={[styles.card, recommended ? styles.cardFeatured : '']
                    .filter(Boolean)
                    .join(' ')}
                >
                  {recommended ? <span className={styles.badge}>Recomendado</span> : null}
                  <h3 className={styles.planName}>{plan.name}</h3>
                  <div className={styles.priceRow}>
                    {price.currency ? (
                      <span className={styles.currency}>{price.currency}</span>
                    ) : null}
                    <span className={styles.price}>{price.label}</span>
                    {price.period ? (
                      <span className={styles.period}>{price.period}</span>
                    ) : null}
                  </div>
                  <ul className={styles.features}>
                    {plan.features.map((feature) => (
                      <li key={feature}>
                        <span className={styles.check} aria-hidden="true">
                          ✓
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className={[styles.button, recommended ? styles.buttonPrimary : '']
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => handleSelect(plan)}
                  >
                    {free ? 'Começar grátis' : `Assinar ${plan.name}`}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
