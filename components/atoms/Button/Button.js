import styles from './Button.module.css';

/**
 * Atom: Button
 * @param {'primary'|'secondary'|'ghost'|'danger'|'gold'} variant
 * @param {'sm'|'md'|'lg'|'full'} size
 * @param {boolean} loading
 * @param {boolean} disabled
 * @param {'button'|'submit'|'reset'} type
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  className = '',
  iconLeft,
  iconRight,
  ...props
}) {
  const classes = [
    styles.btn,
    styles[variant],
    styles[size],
    loading ? styles.loading : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <span className={styles.spinner} aria-hidden="true" />
      )}
      {!loading && iconLeft && (
        <span className={styles.iconLeft}>{iconLeft}</span>
      )}
      <span className={styles.label}>{children}</span>
      {!loading && iconRight && (
        <span className={styles.iconRight}>{iconRight}</span>
      )}
    </button>
  );
}
