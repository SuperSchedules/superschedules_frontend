import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import DateRangePicker from '../components/DateRangePicker';

function setup(initialFrom?: string, initialTo?: string) {
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultFrom = initialFrom || todayStr;
  const defaultTo = initialTo || todayStr;
  let range = { from: defaultFrom, to: defaultTo };
  const onChange = (r: { from: string; to: string }) => {
    range = r;
    rerender(
      <DateRangePicker from={range.from} to={range.to} onChange={onChange} />
    );
  };
  const { rerender } = render(
    <DateRangePicker from={range.from} to={range.to} onChange={onChange} />
  );
  return { todayStr, getRange: () => range };
}

describe('DateRangePicker', () => {
  afterEach(() => cleanup());
  it('snaps end to start when start > end on blur', () => {
    const { getRange } = setup('2030-01-10', '2030-01-05');
    const fromInput = screen.getByLabelText(/from/i) as HTMLInputElement;
    // Trigger blur to invoke correction
    fireEvent.blur(fromInput);
    const { from, to } = getRange();
    expect(from).toBe('2030-01-10');
    expect(to).toBe('2030-01-10');
  });

  it('snaps start to end when end < start on blur', () => {
    const { getRange } = setup('2030-02-10', '2030-02-05');
    const toInput = screen.getByLabelText(/to:/i) as HTMLInputElement;
    fireEvent.blur(toInput);
    const { from, to } = getRange();
    expect(from).toBe('2030-02-05');
    expect(to).toBe('2030-02-05');
  });

  it('corrects on blur to today for incomplete date', () => {
    const { todayStr, getRange } = setup();
    const fromInput = screen.getByLabelText(/from/i) as HTMLInputElement;
    fireEvent.change(fromInput, { target: { value: '2025-09-1' } });
    fireEvent.blur(fromInput);
    const { from } = getRange();
    expect(new Date(from).getTime()).toBeGreaterThanOrEqual(new Date(todayStr).getTime());
  });

  it('allows same-day range without changes', () => {
    const { getRange } = setup('2031-03-15', '2031-03-15');
    const toInput = screen.getByLabelText(/to:/i) as HTMLInputElement;
    // Blur should not change anything when from === to
    fireEvent.blur(toInput);
    const { from, to } = getRange();
    expect(from).toBe('2031-03-15');
    expect(to).toBe('2031-03-15');
  });
});
