import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Chip } from './Chip';

describe('Chip', () => {
  it('renders as a button with type button', () => {
    render(<Chip>2</Chip>);
    const btn = screen.getByRole('button', { name: '2' });
    expect(btn).toHaveAttribute('type', 'button');
  });

  it('reflects selected via aria-pressed', () => {
    const { rerender } = render(<Chip selected={false}>x</Chip>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
    rerender(<Chip selected>x</Chip>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('fires onClick', async () => {
    const onClick = vi.fn();
    render(<Chip onClick={onClick}>x</Chip>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
