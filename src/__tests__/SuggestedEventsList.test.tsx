import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import SuggestedEventsList from '../components/SuggestedEventsList';

describe('SuggestedEventsList', () => {
  afterEach(() => cleanup());
  it('shows spinner when loading', () => {
    render(<SuggestedEventsList events={[]} loading={true} />);
    expect(screen.getByText(/finding relevant events/i)).toBeInTheDocument();
  });

  it('renders event cards when events provided', () => {
    const events = [
      {
        id: 'e1',
        title: 'Event One',
        description: 'Desc',
        location: 'Somewhere',
        start: new Date(),
        end: new Date(),
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
        url: 'https://example.com/event',
      },
    ];
    render(<SuggestedEventsList events={events as any} loading={false} />);
    expect(screen.getByText(/event one/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view details/i })).toBeInTheDocument();
  });
});
