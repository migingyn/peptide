import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = 'primary', className, ...rest }: ButtonProps) {
  const cls = [styles.btn, styles[variant], className].filter(Boolean).join(' ');
  return <button className={cls} {...rest} />;
}
