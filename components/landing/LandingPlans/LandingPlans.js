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

function formatPlanPrice(price, key = '') {
  const value = parsePlanPrice(price);
  if (value === null || value <= 0) {
    return { label: 'Grátis', period: '', currency: '' };
  }
  const formatted = Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace('.', ',');
  
  const isYearly = String(key).toLowerCase().includes('yearly') || String(key).toLowerCase().includes('year') || String(key).toLowerCase().includes('annual') || String(key).toLowerCase().includes('anual');
  const period = isYearly ? '/ano' : '/mês';
  
  return { label: formatted, period, currency: 'R$', value };
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

const cleanPlanName = (name) => {
  return name.replace(/\s*-\s*(Mensal|Anual)\s*/gi, '');
};

export default function LandingPlans({ onSelectPlan }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // 'monthly' | 'yearly'

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

  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const key = String(plan.key || '').toLowerCase();
      if (billingPeriod === 'monthly') {
        return key.endsWith('_monthly') || (!key.endsWith('_yearly') && !key.endsWith('_annual') && !key.includes('yearly') && !key.includes('anual'));
      } else {
        return key.endsWith('_yearly') || key.endsWith('_annual') || key.includes('yearly') || key.includes('anual');
      }
    });
  }, [plans, billingPeriod]);

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
          Fechar deixa de ser sorte quando você treina com Closer.IA.
        </p>
      </div>

      <div className={styles.plansBlock}>
        <div className={styles.plansHead}>
          <p className={styles.eyebrow}>Planos</p>
          <h2 className={styles.plansTitle}>Escolha o ritmo da sua performance.</h2>
        </div>

        <div className={styles.toggleContainer}>
          <div className={styles.toggle}>
            <button
              type="button"
              className={`${styles.toggleBtn} ${billingPeriod === 'monthly' ? styles.toggleBtnActive : ''}`}
              onClick={() => setBillingPeriod('monthly')}
            >
              Mensal
            </button>
            <button
              type="button"
              className={`${styles.toggleBtn} ${billingPeriod === 'yearly' ? styles.toggleBtnActive : ''}`}
              onClick={() => setBillingPeriod('yearly')}
            >
              Anual (Economize até 30%)
            </button>
          </div>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <Spinner size="md" />
          </div>
        ) : filteredPlans.length === 0 ? (
          <p className={styles.empty}>Nenhum plano disponível no momento.</p>
        ) : (
          <div className={styles.grid}>
            {filteredPlans.map((plan) => {
              const price = formatPlanPrice(plan.price, plan.key);
              const free = isFreePlan(plan);
              const recommended = String(plan.key).toLowerCase().includes('premium');
              const isYearly = billingPeriod === 'yearly';
              const monthlyEquivalent = isYearly ? (price.value / 12).toFixed(2).replace('.', ',') : null;

              return (
                <article
                  key={plan.id || plan.key}
                  className={[styles.card, recommended ? styles.cardFeatured : '']
                    .filter(Boolean)
                    .join(' ')}
                >
                  {recommended ? <span className={styles.badge}>Recomendado</span> : null}
                  <h3 className={styles.planName}>{cleanPlanName(plan.name)}</h3>
                  <div className={styles.priceRow}>
                    {price.currency ? (
                      <span className={styles.currency}>{price.currency}</span>
                    ) : null}
                    <span className={styles.price}>{price.label}</span>
                    {price.period ? (
                      <span className={styles.period}>{price.period}</span>
                    ) : null}
                  </div>
                  {isYearly && monthlyEquivalent ? (
                    <p className={styles.equivalent}>
                      Equivalente a R$ {monthlyEquivalent}/mês
                    </p>
                  ) : null}
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
                    {free ? 'Começar grátis' : `Assinar ${cleanPlanName(plan.name)}`}
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
