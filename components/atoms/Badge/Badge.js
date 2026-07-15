import styles from './Badge.module.css';

/**
 * Atom: Badge
 * @param {'default'|'success'|'warning'|'danger'|'info'|'accent'|'gold'} variant
 * @param {'sm'|'md'} size
 * @param {boolean} dot — show colored dot before text
 */
export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
}) {
  const classes = [
    styles.badge,
    styles[variant],
    styles[size],
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {children}
    </span>
  );
}
