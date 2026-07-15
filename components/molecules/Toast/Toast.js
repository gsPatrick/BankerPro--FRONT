import styles from './Toast.module.css';

/**
 * Molecule: Toast
 * @param {'success'|'error'|'info'|'warning'} type
 * @param {string} message
 * @param {boolean} visible
 * @param {Function} onClose
 */
export default function Toast({
  type = 'info',
  message,
  visible = false,
  onClose,
  className = '',
}) {
  if (!visible) return null;

  return (
    <div className={[styles.toast, styles[type], className].filter(Boolean).join(' ')} role="alert">
      <span className={styles.icon}>
        {type === 'success' && '✓'}
        {type === 'error' && '✕'}
        {type === 'warning' && '⚠'}
        {type === 'info' && 'ℹ'}
      </span>
      <span className={styles.message}>{message}</span>
      {onClose && (
        <button className={styles.close} onClick={onClose} aria-label="Fechar notificação">
          ✕
        </button>
      )}
    </div>
  );
}
