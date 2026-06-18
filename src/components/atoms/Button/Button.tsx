import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.css'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style of the button. */
  variant?: ButtonVariant
  /** Size preset. */
  size?: ButtonSize
  /** Stretch to full width of its container. */
  fullWidth?: boolean
  /** Icon shown before the label. */
  leftIcon?: ReactNode
  /** Icon shown after the label. */
  rightIcon?: ReactNode
}

const cx = (...classes: (string | false | undefined)[]) =>
  classes.filter(Boolean).join(' ')

function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  leftIcon,
  rightIcon,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        className,
      )}
      {...rest}
    >
      {leftIcon && <span className={styles.icon}>{leftIcon}</span>}
      {children}
      {rightIcon && <span className={styles.icon}>{rightIcon}</span>}
    </button>
  )
}

export default Button
