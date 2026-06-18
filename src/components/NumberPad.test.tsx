import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NumberPad } from './NumberPad';

describe('NumberPad', () => {
  it('renders a labeled group with all keys', () => {
    render(<NumberPad value="" onChange={() => {}} />);
    expect(screen.getByRole('group', { name: 'Number pad' })).toBeInTheDocument();
    for (const k of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '.']) {
      expect(screen.getByRole('button', { name: k })).toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: 'Backspace' })).toBeInTheDocument();
  });

  it('appends a digit', async () => {
    const onChange = vi.fn();
    render(<NumberPad value="1" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: '2' }));
    expect(onChange).toHaveBeenCalledWith('12');
  });

  it('replaces a lone leading zero with the digit', async () => {
    const onChange = vi.fn();
    render(<NumberPad value="0" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: '5' }));
    expect(onChange).toHaveBeenCalledWith('5');
  });

  it('guards against multiple decimal points', async () => {
    const onChange = vi.fn();
    render(<NumberPad value="1.5" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: '.' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('starts a decimal from empty with leading zero', async () => {
    const onChange = vi.fn();
    render(<NumberPad value="" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: '.' }));
    expect(onChange).toHaveBeenCalledWith('0.');
  });

  it('backspace removes the last char', async () => {
    const onChange = vi.fn();
    render(<NumberPad value="12" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Backspace' }));
    expect(onChange).toHaveBeenCalledWith('1');
  });
});
