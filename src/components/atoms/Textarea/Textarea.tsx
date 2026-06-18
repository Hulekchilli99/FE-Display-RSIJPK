import { useId } from 'react'
import type { TextareaHTMLAttributes } from 'react'
import styles from './Textarea.module.css'

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
}

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ')

function Textarea({ label, hint, id, className, ...rest }: TextareaProps) {
  const generatedId = useId()
  const areaId = id ?? generatedId

  return (
    <div className={cx(styles.field, className)}>
      {label && (
        <label htmlFor={areaId} className={styles.label}>
          {label}
        </label>
      )}
      <textarea id={areaId} className={styles.textarea} {...rest} />
      {hint && <span className={styles.hint}>{hint}</span>}
    </div>
  )
}

export default Textarea
