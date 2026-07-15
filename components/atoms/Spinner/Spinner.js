import styles from './Spinner.module.css';

/**
 * Atom: Spinner
 * @param {'sm'|'md'|'lg'} size
 * @param {'accent'|'white'|'muted'} color
 */
export default function Spinner({ size = 'md', color = 'accent', className = '' }) {
  const classes = [styles.spinner, styles[size], styles[color], className].filter(Boolean).join(' ');
  return (
    <span className={classes} role="status" aria-label="Carregando...">
      <span className="sr-only">Carregando...</span>
    </span>
  );
}
