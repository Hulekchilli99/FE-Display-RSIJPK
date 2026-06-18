import { useId } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import styles from './Input.module.css'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Label rendered above the field. */
  label?: string
  /** Helper or error text rendered below the field. */
  hint?: string
  /** Marks the field as invalid and styles the hint as an error. */
  error?: boolean
  /** Element rendered inside the field, before the input. */
  leftAddon?: ReactNode
  /** Element rendered inside the field, after the input. */
  rightAddon?: ReactNode
}

const cx = (...classes: (string | false | undefined)[]) =>
  classes.filter(Boolean).join(' ')

function Input({
  label,
  hint,
  error = false,
  leftAddon,
  rightAddon,
  id,
  className,
  disabled,
  ...rest
}: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const hintId = hint ? `${inputId}-hint` : undefined

  return (
    <div className={cx(styles.field, disabled && styles.disabled, className)}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}

      <div className={cx(styles.control, error && styles.controlError)}>
        {leftAddon && <span className={styles.addon}>{leftAddon}</span>}
        <input
          id={inputId}
          className={styles.input}
          disabled={disabled}
          aria-invalid={error || undefined}
          aria-describedby={hintId}
          {...rest}
        />
        {rightAddon && <span className={styles.addon}>{rightAddon}</span>}
      </div>

      {hint && (
        <span
          id={hintId}
          className={cx(styles.hint, error && styles.hintError)}
        >
          {hint}
        </span>
      )}
    </div>
  )
}

export default Input
