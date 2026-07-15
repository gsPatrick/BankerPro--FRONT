import styles from './Input.module.css';

/**
 * Atom: Input
 * @param {'text'|'email'|'password'|'number'|'tel'|'search'} type
 * @param {'default'|'error'|'success'} state
 */
export default function Input({
  type = 'text',
  state = 'default',
  placeholder,
  value,
  onChange,
  disabled = false,
  readOnly = false,
  id,
  name,
  iconLeft,
  iconRight,
  className = '',
  ...props
}) {
  const wrapClasses = [
    styles.wrapper,
    styles[state],
    disabled ? styles.disabled : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapClasses}>
      {iconLeft && (
        <span className={styles.iconLeft} aria-hidden="true">
          {iconLeft}
        </span>
      )}
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        readOnly={readOnly}
        className={styles.input}
        aria-invalid={state === 'error'}
        {...props}
      />
      {iconRight && (
        <span className={styles.iconRight} aria-hidden="true">
          {iconRight}
        </span>
      )}
    </div>
  );
}
