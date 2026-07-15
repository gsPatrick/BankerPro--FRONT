import styles from './Card.module.css';

/**
 * Molecule: Card
 * @param {'default'|'elevated'|'interactive'|'accent'} variant
 * @param {boolean} borderGlow - adds a purple gradient glow border
 */
export default function Card({
  children,
  variant = 'default',
  borderGlow = false,
  onClick,
  className = '',
  ...props
}) {
  const classes = [
    styles.card,
    styles[variant],
    borderGlow ? styles.borderGlow : '',
    onClick ? styles.clickable : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...props}
    >
      {children}
    </div>
  );
}
