import BrandMark from '@/components/BrandMark/BrandMark';
import { PLATFORM_NAV_ITEMS } from '@/lib/platformNav';
import styles from './LandingProduct.module.css';

/** Static replica of the Closer.IA platform shell + home panel. */
export default function CloserPanelMock() {
  return (
    <div className={styles.app} aria-hidden="true">
      <aside className={styles.sidebar}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '10px',
            padding: '0 8px 12px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '8px'
          }}
        >
          <BrandMark size={24} />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1px',
              minWidth: 0,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '14px',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: '#ffffff',
                lineHeight: 1.1,
              }}
            >
              Closer.IA
            </span>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#6e6e6e',
                lineHeight: 1,
              }}
            >
              Plataforma
            </span>
          </div>
        </div>
        <nav className={styles.nav}>
          {PLATFORM_NAV_ITEMS.filter(
            (item) => !item.adminOnly && item.type !== 'divider' && item.id !== 'perfil'
          ).map((item) => {
            const isActive = item.id === 'home';
            return (
              <div
                key={item.id}
                className={[styles.navItem, isActive ? styles.navItemActive : '']
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div>
            <p className={styles.topTitle}>Painel</p>
            <p className={styles.topSub}>Closer.IA</p>
          </div>
          <div className={styles.avatar}>BA</div>
        </header>

        <div className={styles.content}>
          <section className={styles.banner}>
            <div className={styles.bannerLeft}>
              <p className={styles.eyebrow}>Principal</p>
              <h3 className={styles.hello}>Olá, Bancário</h3>
              <p className={styles.bannerText}>
                Visão da carteira: perfis atendidos, produtos, metas e agenda do mês.
              </p>
              <div className={styles.pockets}>
                <div>
                  <strong>48</strong>
                  <span>Clientes</span>
                </div>
                <div>
                  <strong>12</strong>
                  <span>Agenda no mês</span>
                </div>
                <div>
                  <strong>72%</strong>
                  <span>Meta geral</span>
                </div>
              </div>
            </div>
            <div className={styles.bannerRight}>
              <div className={styles.ring}>
                <svg viewBox="0 0 120 120" width="104" height="104">
                  <circle cx="60" cy="60" r="50" className={styles.ringTrack} />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    className={styles.ringValue}
                    strokeDasharray={`${2 * Math.PI * 50}`}
                    strokeDashoffset={`${2 * Math.PI * 50 * (1 - 0.72)}`}
                  />
                </svg>
                <span className={styles.ringPct}>72%</span>
              </div>
              <p className={styles.ringHint}>36 de 50 nas metas</p>
            </div>
          </section>

          <section className={styles.kpiRow}>
            {[
              { label: 'Agenda no mês', value: '12', hint: 'julho de 2026' },
              { label: 'Mais comercializado', value: 'Capitalização', hint: '18 fechados' },
              { label: 'Menos comercializado', value: 'Consórcio', hint: '3 registros' },
            ].map((kpi) => (
              <article key={kpi.label} className={styles.kpi}>
                <p className={styles.kpiLabel}>{kpi.label}</p>
                <p className={styles.kpiValue}>{kpi.value}</p>
                <p className={styles.kpiHint}>{kpi.hint}</p>
              </article>
            ))}
          </section>

          <section className={styles.split}>
            <article className={styles.panel}>
              <div className={styles.panelHead}>
                <div>
                  <p className={styles.panelLabel}>Perfis mais atendidos</p>
                  <p className={styles.panelSub}>Por faixa de renda na carteira</p>
                </div>
                <span className={styles.panelLink}>Carteira</span>
              </div>
              <ul className={styles.rankList}>
                {[
                  { name: 'R$ 3.001 a R$ 6.000', count: 16, pct: 100 },
                  { name: 'R$ 6.001 a R$ 10.000', count: 12, pct: 75 },
                  { name: 'Até R$ 3.000', count: 9, pct: 56 },
                  { name: 'R$ 10.001 a R$ 20.000', count: 7, pct: 44 },
                ].map((row, index) => (
                  <li key={row.name} className={styles.rankItem}>
                    <span className={styles.rankIndex}>{index + 1}</span>
                    <div className={styles.rankBody}>
                      <div className={styles.rankTop}>
                        <span>{row.name}</span>
                        <strong>{row.count}</strong>
                      </div>
                      <div className={styles.barTrack}>
                        <div className={styles.barFill} style={{ width: `${row.pct}%` }} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </article>

            <article className={styles.panel}>
              <div className={styles.panelHead}>
                <div>
                  <p className={styles.panelLabel}>Progresso da meta</p>
                  <p className={styles.panelSub}>36 de 50 · 72%</p>
                </div>
                <span className={styles.panelLink}>Metas</span>
              </div>
              <div className={styles.overallBar}>
                <div className={styles.overallFill} style={{ width: '72%' }} />
              </div>
              <ul className={styles.goalList}>
                {[
                  { name: 'Capitalização', meta: '14/15', pct: 93 },
                  { name: 'Seguro de Vida', meta: '10/12', pct: 83 },
                  { name: 'Cartão de Crédito', meta: '8/13', pct: 62 },
                  { name: 'Empréstimo', meta: '4/10', pct: 40 },
                ].map((goal) => (
                  <li key={goal.name} className={styles.goalRow}>
                    <div className={styles.goalTop}>
                      <span>{goal.name}</span>
                      <strong>{goal.meta}</strong>
                    </div>
                    <div className={styles.goalBar}>
                      <div className={styles.goalFill} style={{ width: `${goal.pct}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          </section>
        </div>
      </div>
    </div>
  );
}
