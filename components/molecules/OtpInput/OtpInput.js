'use client';

import { useRef } from 'react';
import styles from './OtpInput.module.css';

/**
 * Entrada de código OTP em quadradinhos (um por dígito).
 *
 * Controlado: recebe `value` (string de dígitos) e emite `onChange(string)`.
 * Cuida de auto-avançar ao digitar, voltar no backspace, colar o código inteiro
 * e navegar com as setas — o comportamento que se espera de um campo de OTP.
 *
 * @param {object} props
 * @param {string} props.value      dígitos atuais (ex.: "1234")
 * @param {(v:string)=>void} props.onChange
 * @param {number} [props.length=6] quantidade de casas
 * @param {boolean} [props.error]   pinta as casas em estado de erro
 * @param {boolean} [props.autoFocus]
 */
export default function OtpInput({ value = '', onChange, length = 6, error = false, autoFocus = false }) {
  const inputsRef = useRef([]);

  const digits = Array.from({ length }, (_, i) => value[i] || '');

  const setDigit = (index, digit) => {
    const arr = value.split('');
    arr[index] = digit;
    // Recompõe só até o comprimento, sem buracos à direita.
    const next = arr.join('').replace(/\D/g, '').slice(0, length);
    onChange(next);
  };

  const focusInput = (index) => {
    const el = inputsRef.current[index];
    if (el) {
      el.focus();
      el.select?.();
    }
  };

  const handleChange = (index, raw) => {
    const only = raw.replace(/\D/g, '');
    if (!only) {
      setDigit(index, '');
      return;
    }
    // Colar vários dígitos numa casa: distribui a partir dela.
    if (only.length > 1) {
      const arr = value.split('');
      for (let i = 0; i < only.length && index + i < length; i += 1) {
        arr[index + i] = only[i];
      }
      const next = arr.join('').replace(/\D/g, '').slice(0, length);
      onChange(next);
      focusInput(Math.min(index + only.length, length - 1));
      return;
    }
    setDigit(index, only);
    if (index < length - 1) focusInput(index + 1);
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[index]) {
        setDigit(index, '');
      } else if (index > 0) {
        setDigit(index - 1, '');
        focusInput(index - 1);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      focusInput(index - 1);
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      focusInput(index + 1);
    }
  };

  const handlePaste = (index, e) => {
    e.preventDefault();
    const pasted = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    onChange(pasted.slice(0, length));
    focusInput(Math.min(pasted.length, length - 1));
  };

  return (
    <div className={styles.root} role="group" aria-label={`Código de ${length} dígitos`}>
      {digits.map((digit, index) => (
        <input
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          ref={(el) => { inputsRef.current[index] = el; }}
          className={[styles.box, digit ? styles.filled : '', error ? styles.error : ''].filter(Boolean).join(' ')}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={index === 0 ? length : 1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={(e) => handlePaste(index, e)}
          onFocus={(e) => e.target.select()}
          autoFocus={autoFocus && index === 0}
          aria-label={`Dígito ${index + 1}`}
        />
      ))}
    </div>
  );
}
