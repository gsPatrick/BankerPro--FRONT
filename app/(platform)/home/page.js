'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Spinner from '@/components/atoms/Spinner/Spinner';
import Toast from '@/components/molecules/Toast/Toast';
import { api } from '@/lib/api';
import { pickField } from '@/lib/normalize';
import styles from './home.module.css';

const INCOME_BANDS = [
  { id: 'ate-3k', label: 'Até R$ 3.000', min: 0, max: 3000 },
  { id: '3k-6k', label: 'R$ 3.001 a R$ 6.000', min: 3001, max: 6000 },
  { id: '6k-10k', label: 'R$ 6.001 a R$ 10.000', min: 6001, max: 10000 },
  { id: '10k-20k', label: 'R$ 10.001 a R$ 20.000', min: 10001, max: 20000 },
  { id: 'acima-20k', label: 'Acima de R$ 20.000', min: 20001, max: Infinity },
];

function toDateKey(value) {
  if (!value) return '';
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function monthPrefix(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function parseIncome(value) {
  if (value == null || value === '') return null;
  let text = String(value).replace(/R\$/gi, '').trim();
  if (!text) return null;

  if (text.includes(',')) {
    text = text.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(text)) {
    text = text.replace(/\./g, '');
  }

  const num = Number(String(text).replace(/[^\d.]/g, ''));
  return Number.isFinite(num) ? num : null;
}

function incomeBandLabel(value) {
  const amount = parseIncome(value);
  if (amount == null) return 'Sem renda informada';
  const band = INCOME_BANDS.find((item) => amount >= item.min && amount <= item.max);
  return band?.label || 'Sem renda informada';
}

function normalizeClient(raw = {}) {
  return {
    id: pickField(raw, 'id'),
    approximateIncome:
      pickField(raw, 'approximateIncome', 'approximate_income') || '',
    offeredProduct: pickField(raw, 'offeredProduct', 'offered_product') || '',
    status: pickField(raw, 'status') || '',
    nextReturn: toDateKey(pickField(raw, 'nextReturn', 'next_return')),
  };
}

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

function countBy(items, getKey) {
  const map = new Map();
  items.forEach((item) => {
    const key = String(getKey(item) || '').trim();
    if (!key) return;
    map.set(key, (map.get(key) || 0) + 1);
  });
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'pt-BR'));
}

function firstName(fullName) {
  const part = String(fullName || '').trim().split(/\s+/)[0];
  return part || 'bancário';
}

function ProgressRing({ pct, size = 132, stroke = 9 }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(pct, 100) / 100) * circumference;

  return (
    <svg
      className={styles.ringSvg}
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

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [goals, setGoals] = useState([]);
  const [userName, setUserName] = useState('');
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'error',
  });

  const showToast = (message, type = 'error') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((current) => ({ ...current, visible: false })), 3800);
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const [clientsRes, goalsRes, meRes] = await Promise.all([
          api.get('/clients'),
          api.get('/goals'),
          api.get('/auth/me').catch(() => null),
        ]);

        if (!active) return;

        const clientList = Array.isArray(clientsRes?.data)
          ? clientsRes.data
          : Array.isArray(clientsRes)
            ? clientsRes
            : [];
        const goalList = Array.isArray(goalsRes?.data)
          ? goalsRes.data
          : Array.isArray(goalsRes)
            ? goalsRes
            : [];

        setClients(clientList.map(normalizeClient));
        setGoals(goalList.map(normalizeGoal));

        const me = meRes?.data || meRes || {};
        setUserName(
          pickField(me, 'fullName', 'full_name') ||
            pickField(me, 'name') ||
            ''
        );
      } catch (err) {
        if (active) {
          showToast(err.message || 'Não foi possível carregar o painel.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const clientsWithIncome = clients.filter(
      (client) => parseIncome(client.approximateIncome) != null
    );
    const profiles = countBy(clientsWithIncome, (client) =>
      incomeBandLabel(client.approximateIncome)
    ).slice(0, 5);
    const profileMax = profiles[0]?.count || 0;

    const soldClients = clients.filter(
      (client) =>
        client.offeredProduct &&
        String(client.status).toLowerCase() === 'fechado'
    );
    const productSource =
      soldClients.length > 0
        ? soldClients
        : clients.filter((client) => client.offeredProduct);
    const products = countBy(productSource, (client) => client.offeredProduct);
    const topProduct = products[0] || null;
    const bottomProduct =
      products.length > 1 ? products[products.length - 1] : products[0] || null;

    const goalTarget = goals.reduce((sum, goal) => sum + goal.target, 0);
    const goalAchieved = goals.reduce((sum, goal) => sum + goal.achieved, 0);
    const goalPct = pctOf(goalAchieved, goalTarget);
    const goalItems = [...goals]
      .map((goal) => ({
        ...goal,
        pct: pctOf(goal.achieved, goal.target),
      }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 4);

    const month = monthPrefix();
    const agendaCount = clients.filter((client) =>
      client.nextReturn.startsWith(month)
    ).length;

    const monthLabel = new Date().toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    });

    return {
      profiles,
      profileMax,
      topProduct,
      bottomProduct,
      usingClosedOnly: soldClients.length > 0,
      goalTarget,
      goalAchieved,
      goalPct,
      goalItems,
      agendaCount,
      monthLabel,
      clientCount: clients.length,
    };
  }, [clients, goals]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.banner} data-tour="tour-home-banner">
        <div className={styles.bannerLeft}>
          <div className={styles.bannerCopy}>
            <p className={styles.eyebrow}>Principal</p>
            <h1 className={styles.title}>Olá, {firstName(userName)}</h1>
            <p className={styles.subtitle}>
              Visão da carteira: perfis atendidos, produtos, metas e agenda do mês.
            </p>
          </div>
          <div className={styles.pocketStats}>
            <div className={styles.pocketStat}>
              <strong>{stats.clientCount}</strong>
              <span>Clientes</span>
            </div>
            <div className={styles.pocketStat}>
              <strong>{stats.agendaCount}</strong>
              <span>Agenda no mês</span>
            </div>
            <div className={styles.pocketStat}>
              <strong>{stats.goalPct}%</strong>
              <span>Meta geral</span>
            </div>
          </div>
        </div>
        <div className={styles.bannerRight}>
          <div className={styles.ringWrap}>
            <ProgressRing pct={stats.goalPct} />
            <div className={styles.ringCenter}>
              <p className={styles.ringPct}>{stats.goalPct}%</p>
            </div>
          </div>
          <p className={styles.ringHint}>
            {stats.goalTarget > 0
              ? `${stats.goalAchieved} de ${stats.goalTarget} nas metas`
              : 'Defina metas em Metas'}
          </p>
        </div>
      </section>

      <section className={styles.kpiRow}>
        <Link href="/agenda" className={styles.kpi}>
          <p className={styles.kpiLabel}>Agenda no mês</p>
          <p className={styles.kpiValue}>{stats.agendaCount}</p>
          <p className={styles.kpiHint}>{stats.monthLabel}</p>
        </Link>

        <Link href="/carteira" className={styles.kpi}>
          <p className={styles.kpiLabel}>Mais comercializado</p>
          <p className={styles.kpiValue}>
            {stats.topProduct?.label || '—'}
          </p>
          <p className={styles.kpiHint}>
            {stats.topProduct
              ? `${stats.topProduct.count} ${
                  stats.usingClosedOnly
                    ? stats.topProduct.count === 1
                      ? 'fechado'
                      : 'fechados'
                    : 'na carteira'
                }`
              : 'Sem produto ainda'}
          </p>
        </Link>

        <Link href="/carteira" className={styles.kpi}>
          <p className={styles.kpiLabel}>Menos comercializado</p>
          <p className={styles.kpiValue}>
            {stats.bottomProduct?.label || '—'}
          </p>
          <p className={styles.kpiHint}>
            {stats.bottomProduct
              ? `${stats.bottomProduct.count} ${
                  stats.bottomProduct.count === 1 ? 'registro' : 'registros'
                }`
              : 'Sem produto ainda'}
          </p>
        </Link>
      </section>

      <section className={styles.split}>
        <article className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <p className={styles.panelLabel}>Perfis mais atendidos</p>
              <p className={styles.panelSub}>Por faixa de renda na carteira</p>
            </div>
            <Link href="/carteira" className={styles.panelLink}>
              Carteira
            </Link>
          </div>

          {stats.profiles.length > 0 ? (
            <ul className={styles.rankList}>
              {stats.profiles.map((item, index) => (
                <li key={item.label} className={styles.rankItem}>
                  <span className={styles.rankIndex}>{index + 1}</span>
                  <div className={styles.rankBody}>
                    <div className={styles.rankTop}>
                      <p className={styles.rankName}>{item.label}</p>
                      <p className={styles.rankCount}>{item.count}</p>
                    </div>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFill}
                        style={{
                          width: `${
                            stats.profileMax
                              ? Math.round((item.count / stats.profileMax) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.emptyHint}>
              Cadastre clientes com renda aproximada para montar o ranking.
            </p>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <p className={styles.panelLabel}>Progresso da meta</p>
              <p className={styles.panelSub}>
                {stats.goalTarget > 0
                  ? `${stats.goalAchieved} de ${stats.goalTarget} · ${stats.goalPct}%`
                  : 'Nenhuma meta cadastrada'}
              </p>
            </div>
            <Link href="/metas" className={styles.panelLink}>
              Metas
            </Link>
          </div>

          {stats.goalTarget > 0 ? (
            <>
              <div className={styles.overallBar}>
                <div
                  className={styles.overallFill}
                  style={{ width: `${Math.min(stats.goalPct, 100)}%` }}
                />
              </div>
              {stats.goalItems.length > 0 ? (
                <ul className={styles.goalList}>
                  {stats.goalItems.map((goal) => (
                    <li key={goal.id} className={styles.goalRow}>
                      <div className={styles.goalTop}>
                        <p className={styles.goalName}>{goal.label}</p>
                        <p className={styles.goalMeta}>
                          {goal.achieved}/{goal.target}
                        </p>
                      </div>
                      <div className={styles.goalBar}>
                        <div
                          className={`${styles.goalFill} ${
                            goal.pct >= 100 ? styles.goalFillDone : ''
                          }`}
                          style={{ width: `${Math.min(goal.pct, 100)}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : (
            <p className={styles.emptyHint}>
              Defina alvos em Metas para acompanhar o progresso aqui.
            </p>
          )}
        </article>
      </section>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((current) => ({ ...current, visible: false }))}
      />
    </div>
  );
}
