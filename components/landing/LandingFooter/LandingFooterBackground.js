import styles from './LandingFooterBackground.module.css';

/**
 * Fixed landscape reveal under the footer — same hero still used on login/hero.
 */
export default function LandingFooterBackground() {
  return (
    <div className={styles.wrap} aria-hidden="true">
      <div className={styles.inner}>
        <div className={styles.gradient} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/pexels-vazhnik-7864382.jpg"
          alt=""
          className={styles.image}
        />
        <div className={styles.bar}>
          <span>© {new Date().getFullYear()} Closer.IA</span>
          <a
            href="https://codebypatrick.dev/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Desenvolvido por Patrick.Developer
          </a>
        </div>
      </div>
    </div>
  );
}
