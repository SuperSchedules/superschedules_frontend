import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import Home from '../pages/Home';
import { AuthContext } from '../auth';

function renderWithAuth(ui) {
  const value = {
    user: { token: 'abc' },
    authFetch: {
      get: vi.fn(),
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
  it('shows the chat interface for authenticated users', async () => {
    renderWithAuth(<Home />);
    expect(await screen.findByLabelText(/message input/i)).toBeInTheDocument();
    expect(screen.getByText(/preferences/i)).toBeInTheDocument();
  });
});
