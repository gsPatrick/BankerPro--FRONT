'use client';

import { useEffect, useMemo, useState } from 'react';
import Spinner from '@/components/atoms/Spinner/Spinner';
import Toast from '@/components/molecules/Toast/Toast';
import Modal from '@/components/organisms/Modal/Modal';
import { api } from '@/lib/api';
import styles from './analytics.module.css';

const RANGES = [
  { days: 1, label: 'Hoje' },
  { days: 7, label: '7 dias' },
  { days: 30, label: '30 dias' },
  { days: 90, label: '90 dias' },
  { days: 365, label: '1 ano' },
];

// Monta "Cidade · Estado · País" com o que existir.
const fmtGeo = (obj, { short = false } = {}) => {
  if (!obj) return '—';
  const parts = short
    ? [obj.city, obj.region].filter(Boolean)
    : [obj.city, obj.region, obj.country].filter(Boolean);
  return parts.length ? parts.join(' · ') : '—';
};

const FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'identified', label: 'Identificados' },
  { key: 'abandoned', label: 'Abandono de compra' },
  { key: 'purchased', label: 'Compraram' },
];

// A API serializa TODA resposta em snake_case (toSnakeCase no sendSuccess).
// Convertemos de volta para camelCase aqui, recursivamente, para o resto da
// página ler os campos direto (visitorId, byDevice, avgDurationSeconds, etc.).
const snakeToCamel = (s) => s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
const camelizeDeep = (val) => {
  if (Array.isArray(val)) return val.map(camelizeDeep);
  if (val && typeof val === 'object') {
    const out = {};
    for (const k of Object.keys(val)) out[snakeToCamel(k)] = camelizeDeep(val[k]);
    return out;
  }
  return val;
};

const fmtInt = (n) => new Intl.NumberFormat('pt-BR').format(Number(n || 0));
const fmtPct = (n) => `${(Number(n || 0) * 100).toFixed(1)}%`;

const fmtDuration = (secs) => {
  const s = Math.max(0, Math.round(Number(secs || 0)));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m < 60) return `${m}m ${rem}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
};

const fmtDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
    });
  } catch { return String(d); }
};

const fmtRelative = (d) => {
  if (!d) return '—';
  const diff = Date.now() - new Date(d).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora mesmo';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const days = Math.floor(h / 24);
  return `há ${days}d`;
};

const EVENT_LABEL = {
  pageview: 'Visualizou a página',
  click: 'Clicou',
  identify: 'Preencheu dados',
  checkout_start: 'Chegou na tela de planos',
  checkout_abandon: 'Abandonou o checkout',
  purchase: 'Concluiu a compra',
  custom: 'Evento',
};

// Nomes técnicos de clique → texto amigável no timeline.
const CLICK_LABEL = {
  'lp:comecar-agora': 'Começar agora (landing)',
  'lp:entrar': 'Entrar (landing)',
  'gate:criar-conta': 'Criar conta nova',
  'gate:ja-tenho-conta': 'Já tenho conta',
  'plano:selecionado': 'Selecionou um plano',
  'plano:periodo': 'Trocou o período',
  'funil:login': 'Abriu o login',
  'funil:register': 'Abriu o cadastro',
  'funil:gate': 'Abriu as opções de entrada',
  'funil:forgot': 'Abriu recuperar senha',
};

// Descreve um evento de forma legível, puxando o que importa do metadata.
const describeEvent = (e) => {
  const m = e.metadata || {};
  if (e.type === 'click') {
    let base = CLICK_LABEL[e.name] || e.name || 'Clique';
    if (e.name === 'plano:selecionado') {
      const parts = [m.planName || m.planKey, m.price ? `R$ ${m.price}` : null, m.period === 'yearly' ? 'anual' : m.period === 'monthly' ? 'mensal' : null].filter(Boolean);
      if (parts.length) base += ` — ${parts.join(' · ')}`;
    } else if (e.name === 'plano:periodo') {
      base += m.period === 'yearly' ? ': Anual' : ': Mensal';
    }
    return base;
  }
  if (e.type === 'purchase') {
    const parts = [m.plan, m.price ? `R$ ${m.price}` : null].filter(Boolean);
    return parts.length ? `${EVENT_LABEL.purchase} — ${parts.join(' · ')}` : EVENT_LABEL.purchase;
  }
  return EVENT_LABEL[e.type] || e.type;
};

function Kpi({ label, value, hint, tone }) {
  return (
    <div className={styles.kpi}>
      <p className={styles.kpiLabel}>{label}</p>
      <div className={`${styles.kpiValue} ${tone === 'green' ? styles.kpiAccent : tone === 'warn' ? styles.kpiWarn : ''}`}>{value}</div>
      {hint && <p className={styles.kpiHint}>{hint}</p>}
    </div>
  );
}

function Bars({ rows, keyName }) {
  const safe = Array.isArray(rows) ? rows : [];
  const max = Math.max(1, ...safe.map((r) => r.count || 0));
  return (
    <div>
      {safe.length === 0 && <p className={styles.empty}>Sem dados no período.</p>}
      {safe.map((r) => (
        <div className={styles.barRow} key={r[keyName]}>
          <span className={styles.barLabel}>{r[keyName]}</span>
          <div className={styles.barTrack}><div className={styles.barFill} style={{ width: `${(r.count / max) * 100}%` }} /></div>
          <span className={styles.barValue}>{fmtInt(r.count)}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(30);
  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);

  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [visitors, setVisitors] = useState(null);
  const [loadingVisitors, setLoadingVisitors] = useState(true);

  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });
  const showToast = (message, type = 'error') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((c) => ({ ...c, visible: false })), 3500);
  };

  useEffect(() => {
    let cancel = false;
    setLoadingOverview(true);
    api.get(`/analytics/overview?days=${days}`)
      .then((res) => { if (!cancel) setOverview(camelizeDeep(res?.data || res)); })
      .catch((err) => { if (!cancel) showToast(err.message || 'Erro ao carregar métricas.'); })
      .finally(() => { if (!cancel) setLoadingOverview(false); });
    return () => { cancel = true; };
  }, [days]);

  useEffect(() => {
    let cancel = false;
    setLoadingVisitors(true);
    const params = new URLSearchParams({ page: String(page), limit: '20', filter, q });
    api.get(`/analytics/visitors?${params.toString()}`)
      .then((res) => { if (!cancel) setVisitors(camelizeDeep(res?.data || res)); })
      .catch((err) => { if (!cancel) showToast(err.message || 'Erro ao carregar visitantes.'); })
      .finally(() => { if (!cancel) setLoadingVisitors(false); });
    return () => { cancel = true; };
  }, [filter, q, page]);

  useEffect(() => { setPage(1); }, [filter, q]);

  const openDetail = async (visitorId) => {
    setDetailLoading(true);
    setDetail({ loading: true });
    try {
      const res = await api.get(`/analytics/visitors/${visitorId}`);
      setDetail(camelizeDeep(res?.data || res));
    } catch (err) {
      showToast(err.message || 'Erro ao carregar detalhe.');
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const funnel = overview?.funnel || {};
  const oVisitors = overview?.visitors || {};
  const oSessions = overview?.sessions || {};
  const items = Array.isArray(visitors?.items) ? visitors.items : [];

  const stageBadge = (v) => {
    if (v.purchased) return <span className={`${styles.badge} ${styles.badgeGreen}`}>Comprou</span>;
    if (v.checkoutStarted) return <span className={`${styles.badge} ${styles.badgeWarn}`}>Abandonou</span>;
    if (v.email) return <span className={`${styles.badge} ${styles.badgeInfo}`}>Identificado</span>;
    return <span className={`${styles.badge} ${styles.badgeNeutral}`}>Anônimo</span>;
  };

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>Analytics da Landing Page</h1>
          <p className={styles.subtitle}>
            Quem entrou, de onde veio, em que dispositivo, quanto tempo ficou e até onde foi no funil.
            Quando a pessoa preenche nome/e-mail, o visitante deixa de ser anônimo e passa a ser recuperável.
          </p>
        </div>
        <div className={styles.ranges}>
          {RANGES.map((r) => (
            <button
              key={r.days}
              className={`${styles.rangeBtn} ${days === r.days ? styles.rangeActive : ''}`}
              onClick={() => setDays(r.days)}
            >{r.label}</button>
          ))}
        </div>
      </div>

      {loadingOverview || !overview ? (
        <div style={{ display: 'grid', placeItems: 'center', padding: 48 }}><Spinner size="lg" /></div>
      ) : (
        <>
          <div className={styles.kpis}>
            <Kpi label="Visitantes" value={fmtInt(oVisitors.range)} hint={`${fmtInt(oVisitors.today)} hoje`} />
            <Kpi label="Identificados" value={fmtInt(oVisitors.identified)} hint="Deixaram nome/e-mail" />
            <Kpi label="Sessões" value={fmtInt(oSessions.range)} hint={`${fmtInt(oSessions.today)} hoje`} />
            <Kpi label="Tempo médio / sessão" value={fmtDuration(oSessions.avgDurationSeconds)} hint="Duração média da visita" />
            <Kpi label="Checkouts iniciados" value={fmtInt(funnel.checkoutStarts)} hint="Começaram uma compra" />
            <Kpi label="Compras" value={fmtInt(funnel.purchases)} hint="Concluíram o pagamento" tone="green" />
            <Kpi label="Abandonos" value={fmtInt(funnel.abandoned)} hint="Iniciaram e não compraram" tone="warn" />
            <Kpi label="Conversão" value={fmtPct(funnel.conversionRate)} hint="Compras ÷ sessões" />
          </div>

          <div className={`${styles.section} ${styles.breakdowns}`}>
            <div className={styles.panel}>
              <div className={styles.sectionHead}>
                <div>
                  <h2 className={styles.sectionTitle}>Dispositivos</h2>
                  <p className={styles.sectionDesc}>Em que aparelho as sessões aconteceram.</p>
                </div>
              </div>
              <Bars rows={overview.byDevice} keyName="device" />
            </div>
            <div className={styles.panel}>
              <div className={styles.sectionHead}>
                <div>
                  <h2 className={styles.sectionTitle}>Origem do tráfego</h2>
                  <p className={styles.sectionDesc}>utm_source do link (ou “direto” quando não há UTM).</p>
                </div>
              </div>
              <Bars rows={overview.bySource} keyName="source" />
            </div>
            <div className={styles.panel}>
              <div className={styles.sectionHead}>
                <div>
                  <h2 className={styles.sectionTitle}>Regiões</h2>
                  <p className={styles.sectionDesc}>Estado/país estimado pelo IP das sessões.</p>
                </div>
              </div>
              <Bars rows={overview.byRegion} keyName="region" />
            </div>
          </div>
        </>
      )}

      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <h2 className={styles.sectionTitle}>Visitantes</h2>
            <p className={styles.sectionDesc}>Clique numa linha para ver a jornada completa da pessoa.</p>
          </div>
          <input
            className={styles.search}
            placeholder="Buscar por nome, e-mail ou IP"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className={styles.filters} style={{ marginBottom: 12 }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`${styles.filterBtn} ${filter === f.key ? styles.filterActive : ''}`}
              onClick={() => setFilter(f.key)}
            >{f.label}</button>
          ))}
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Pessoa</th>
                <th>Estágio</th>
                <th>Dispositivo</th>
                <th>Local</th>
                <th>IP</th>
                <th>Origem</th>
                <th>Sessões</th>
                <th>Última visita</th>
              </tr>
            </thead>
            <tbody>
              {loadingVisitors ? (
                <tr><td colSpan={8}><div style={{ display: 'grid', placeItems: 'center', padding: 24 }}><Spinner /></div></td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={8}><p className={styles.empty}>Nenhum visitante neste filtro ainda.</p></td></tr>
              ) : items.map((v, i) => (
                <tr key={v.visitorId || v.id || i} className={styles.clickable} onClick={() => v.visitorId && openDetail(v.visitorId)}>
                  <td>
                    <div className={styles.strong}>{v.name || 'Anônimo'}</div>
                    <div className={styles.muted}>{v.email || (v.visitorId || '').slice(0, 8) || '—'}</div>
                  </td>
                  <td>{stageBadge(v)}</td>
                  <td>{v.deviceType || '—'}<div className={styles.muted}>{[v.os, v.browser].filter(Boolean).join(' · ')}</div></td>
                  <td className={styles.muted}>{fmtGeo(v, { short: true })}</td>
                  <td className={styles.muted}>{v.ipAddress || '—'}</td>
                  <td className={styles.muted}>{v.firstUtmSource || 'direto'}</td>
                  <td>{fmtInt(v.sessionsCount)}</td>
                  <td className={styles.muted}>{fmtRelative(v.lastSeenAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {visitors && visitors.pages > 1 && (
          <div className={styles.pager}>
            <button className={styles.pagerBtn} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</button>
            <span className={styles.muted}>Página {visitors.page} de {visitors.pages} · {fmtInt(visitors.total)} no total</span>
            <button className={styles.pagerBtn} disabled={page >= visitors.pages} onClick={() => setPage((p) => p + 1)}>Próxima</button>
          </div>
        )}
      </div>

      <Modal
        isOpen={Boolean(detail)}
        onClose={() => setDetail(null)}
        title="Jornada do visitante"
      >
        {detailLoading || detail?.loading ? (
          <div style={{ display: 'grid', placeItems: 'center', padding: 32 }}><Spinner /></div>
        ) : detail?.visitor ? (
          <div>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}><p className="k">Nome</p><p className="v">{detail.visitor.name || '—'}</p></div>
              <div className={styles.detailItem}><p className="k">E-mail</p><p className="v">{detail.visitor.email || '—'}</p></div>
              <div className={styles.detailItem}><p className="k">Telefone</p><p className="v">{detail.visitor.phone || '—'}</p></div>
              <div className={styles.detailItem}><p className="k">IP</p><p className="v">{detail.visitor.ipAddress || '—'}</p></div>
              <div className={styles.detailItem}><p className="k">Localização</p><p className="v">{fmtGeo(detail.visitor)}</p></div>
              <div className={styles.detailItem}><p className="k">Dispositivo</p><p className="v">{[detail.visitor.deviceType, detail.visitor.os, detail.visitor.browser].filter(Boolean).join(' · ') || '—'}</p></div>
              <div className={styles.detailItem}><p className="k">Origem (1º toque)</p><p className="v">{detail.visitor.firstUtmSource || 'direto'}{detail.visitor.firstUtmCampaign ? ` · ${detail.visitor.firstUtmCampaign}` : ''}</p></div>
              <div className={styles.detailItem}><p className="k">Primeira visita</p><p className="v">{fmtDate(detail.visitor.firstSeenAt)}</p></div>
              <div className={styles.detailItem}><p className="k">Última visita</p><p className="v">{fmtDate(detail.visitor.lastSeenAt)}</p></div>
            </div>

            <h3 className={styles.sectionTitle} style={{ margin: '4px 0 10px' }}>
              Sessões ({(detail.sessions || []).length})
            </h3>
            {(detail.sessions || []).map((s) => (
              <div className={styles.sessionCard} key={s.sessionId}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <span className={styles.strong}>{fmtDate(s.startedAt)}</span>
                  <span className={`${styles.badge} ${styles.badgeInfo}`}>⏱ {fmtDuration(s.durationSeconds)}</span>
                </div>
                <div className={styles.muted} style={{ marginTop: 6 }}>
                  {fmtInt(s.pageviewsCount)} páginas · {fmtInt(s.clicksCount)} cliques · {s.deviceType || '—'}
                  {fmtGeo(s, { short: true }) !== '—' ? ` · ${fmtGeo(s, { short: true })}` : ''}
                </div>
                <div className={styles.muted} style={{ marginTop: 2 }}>
                  Origem: {s.utmSource || 'direto'}
                  {s.referrer ? ` · ref: ${s.referrer}` : ''}
                  {s.landingPath ? ` · entrou em ${s.landingPath}` : ''}
                </div>
                {(s.checkoutStarted || s.purchased) && (
                  <div style={{ marginTop: 6 }}>
                    {s.purchased
                      ? <span className={`${styles.badge} ${styles.badgeGreen}`}>Comprou nesta sessão</span>
                      : <span className={`${styles.badge} ${styles.badgeWarn}`}>Abandonou o checkout</span>}
                  </div>
                )}
              </div>
            ))}

            <h3 className={styles.sectionTitle} style={{ margin: '18px 0 10px' }}>Linha do tempo</h3>
            <div className={styles.timeline}>
              {(detail.events || []).length === 0 && <p className={styles.empty}>Sem eventos registrados.</p>}
              {(detail.events || []).map((e) => (
                <div className={styles.titem} key={e.id}>
                  <div className={styles.tType}>{describeEvent(e)}</div>
                  <div className={styles.tMeta}>{fmtDate(e.occurredAt || e.createdAt)}{e.path ? ` · ${e.path}` : ''}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className={styles.empty}>Não foi possível carregar.</p>
        )}
      </Modal>

      <Toast {...toast} onClose={() => setToast((c) => ({ ...c, visible: false }))} />
    </div>
  );
}
