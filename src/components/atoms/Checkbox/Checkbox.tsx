import { useId } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import styles from './Checkbox.module.css'

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Text shown next to the checkbox. */
  label?: ReactNode
}

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ')

function Checkbox({ label, id, className, ...rest }: CheckboxProps) {
  const generatedId = useId()
  const boxId = id ?? generatedId

  return (
    <label htmlFor={boxId} className={cx(styles.row, className)}>
      <input id={boxId} type="checkbox" className={styles.box} {...rest} />
      {label && <span className={styles.label}>{label}</span>}
    </label>
  )
}

export default Checkbox
