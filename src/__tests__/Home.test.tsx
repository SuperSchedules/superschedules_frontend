import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import Home from '../pages/Home.jsx';
import { AuthContext } from '../auth.jsx';

function renderWithAuth(ui, { sources = [] } = {}) {
  const value = {
    user: { token: 'abc' },
    authFetch: {
      get: vi.fn().mockResolvedValue({ data: sources }),
      post: vi.fn(),
    },
  };
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={value}>{ui}</AuthContext.Provider>
    </MemoryRouter>
  );
}

describe('Home', () => {
  it('shows new source fields', async () => {
    const sources = [
      {
        id: 1,
        base_url: 'https://example.com',
        date_added: '2024-01-01',
        last_run_at: '2024-01-02',
        status: 'not run',
      },
    ];
    renderWithAuth(<Home />, { sources });
    await screen.findByText('Submitted Sites');
    expect(screen.getByText('Date Added')).toBeInTheDocument();
    expect(screen.getByText('Last Run')).toBeInTheDocument();
    expect(screen.getByText(/not run/i)).toBeInTheDocument();
  });
});
