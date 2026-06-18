import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Segmented } from './Segmented';

const OPTS = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
];

describe('Segmented', () => {
  it('marks the active option with aria-pressed=true', () => {
    render(<Segmented options={OPTS} value="a" onChange={() => {}} ariaLabel="Pick" />);
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onChange with the clicked value', async () => {
    const onChange = vi.fn();
    render(<Segmented options={OPTS} value="a" onChange={onChange} ariaLabel="Pick" />);
    await userEvent.click(screen.getByRole('tab', { name: 'Beta' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });
});
