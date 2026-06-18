import type { ReactNode } from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
}

export function EmptyState({ title, body, actionLabel, onAction, icon }: EmptyStateProps) {
  return (
    <div
      role="status"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 'var(--s-3)',
        padding: 'var(--s-6) var(--s-4)',
        color: 'var(--text-1)',
      }}
    >
      {icon}
      <h2 style={{ color: 'var(--text-0)', fontSize: 'var(--t-h2)', margin: 0 }}>{title}</h2>
      {body ? <p style={{ margin: 0, color: 'var(--text-2)' }}>{body}</p> : null}
      {actionLabel && onAction ? <Button onClick={onAction}>{actionLabel}</Button> : null}
    </div>
  );
}
