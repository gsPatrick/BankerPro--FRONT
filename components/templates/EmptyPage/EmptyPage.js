import styles from './EmptyPage.module.css';

/**
 * Empty content template used by unfinished platform pages.
 */
export default function EmptyPage({
  eyebrow = 'Closer.IA',
  title,
  description = 'Base da plataforma pronta. O conteúdo desta área será preenchido nas próximas etapas.',
}) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>
      </header>

      <section className={styles.emptyState} aria-label="Área de conteúdo">
        <div className={styles.emptyIcon} aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </svg>
        </div>
        <h2 className={styles.emptyTitle}>Página vazia</h2>
        <p className={styles.emptyText}>
          Template de conteúdo à direita no desktop e área central no mobile.
        </p>
      </section>
    </div>
  );
}
