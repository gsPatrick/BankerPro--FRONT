import { getMediaUrl } from '@/lib/api';
import styles from './Avatar.module.css';

/**
 * Atom: Avatar
 * @param {'sm'|'md'|'lg'|'xl'} size
 * @param {string} src - image URL (optional)
 * @param {string} initials - fallback text (e.g. "PH")
 * @param {boolean} online - show online indicator
 */
export default function Avatar({ size = 'md', src, initials, online = false, className = '' }) {
  const classes = [styles.avatar, styles[size], className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {src ? (
        <img src={getMediaUrl(src)} alt={initials || 'Avatar'} className={styles.img} />
      ) : (
        <span className={styles.initials}>{initials}</span>
      )}
      {online && <span className={styles.onlineDot} aria-label="Online" />}
    </div>
  );
}
