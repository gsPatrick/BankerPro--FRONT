import Input from '@/components/atoms/Input/Input';
import styles from './FormField.module.css';

/**
 * Molecule: FormField
 * Composes Label + Input + HelperText
 */
export default function FormField({
  id,
  label,
  type = 'text',
  state = 'default',
  helperText,
  placeholder,
  value,
  onChange,
  disabled,
  required,
  iconLeft,
  iconRight,
  className = '',
}) {
  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
          {required && <span className={styles.required} aria-hidden="true"> *</span>}
        </label>
      )}
      <Input
        id={id}
        type={type}
        state={state}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        iconLeft={iconLeft}
        iconRight={iconRight}
      />
      {helperText && (
        <p className={[styles.helper, styles[state]].filter(Boolean).join(' ')}>
          {helperText}
        </p>
      )}
    </div>
  );
}
