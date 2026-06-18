import type { ButtonHTMLAttributes } from 'react';
import styles from './Chip.module.css';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

export function Chip({ selected = false, className, ...rest }: ChipProps) {
  const cls = [styles.chip, selected ? styles.selected : '', className].filter(Boolean).join(' ');
  return <button type="button" aria-pressed={selected} className={cls} {...rest} />;
}
