import { useId } from 'react'
import type { SelectHTMLAttributes } from 'react'
import styles from './Select.module.css'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  /** Options as data; alternatively pass <option> children. */
  options?: SelectOption[]
}

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ')

function Select({
  label,
  hint,
  options,
  id,
  className,
  children,
  ...rest
}: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId

  return (
    <div className={cx(styles.field, className)}>
      {label && (
        <label htmlFor={selectId} className={styles.label}>
          {label}
        </label>
      )}
      <div className={styles.control}>
        <select id={selectId} className={styles.select} {...rest}>
          {options
            ? options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))
            : children}
        </select>
        <span className={styles.chevron} aria-hidden="true">
          ▾
        </span>
      </div>
      {hint && <span className={styles.hint}>{hint}</span>}
    </div>
  )
}

export default Select
