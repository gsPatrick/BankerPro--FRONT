import styles from './BrandMark.module.css';

/**
 * Marca geométrica Closer.IA — squircle com centro vazado.
 */
export default function BrandMark({ className = '', size, title }) {
  return (
    <svg
      className={[styles.root, className].filter(Boolean).join(' ')}
      viewBox="0 0 128 128"
      width={size}
      height={size}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      <rect className={styles.frame} x="14" y="14" width="100" height="100" rx="30" />
      <circle className={styles.hole} cx="64" cy="64" r="26" />
    </svg>
  );
}
