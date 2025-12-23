import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import LocationAutocomplete from '../components/LocationAutocomplete';
import { createMockLocationSuggestion, createMockLocationSuggestions } from './mocks/api';
import type { LocationSuggestion } from '../types/index';

// Mock the auth hook
vi.mock('../auth', () => ({
  useAuth: () => ({
    authFetch: {
      get: vi.fn(),
    },
  }),
}));

// Create mock state for the hook
const createMockHookState = (overrides: Partial<{
  suggestions: LocationSuggestion[];
  isLoading: boolean;
  error: string | null;
  isOpen: boolean;
  highlightedIndex: number;
}> = {}) => ({
  suggestions: [],
  isLoading: false,
  error: null,
  isOpen: false,
  highlightedIndex: -1,
  search: vi.fn(),
  close: vi.fn(),
  open: vi.fn(),
  highlightNext: vi.fn(),
  highlightPrev: vi.fn(),
  getHighlighted: vi.fn(() => null),
  clearSuggestions: vi.fn(),
  retry: vi.fn(),
  ...overrides,
});

let mockHookState = createMockHookState();

vi.mock('../hooks/useLocationAutocomplete', () => ({
  useLocationAutocomplete: () => mockHookState,
}));

describe('LocationAutocomplete', () => {
  beforeEach(() => {
    mockHookState = createMockHookState();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders with placeholder', () => {
    render(
      <LocationAutocomplete
        value={null}
        onChange={vi.fn()}
        placeholder="City or town..."
      />
    );
    expect(screen.getByPlaceholderText('City or town...')).toBeInTheDocument();
  });

  it('renders with value', () => {
    const value = createMockLocationSuggestion();
    render(<LocationAutocomplete value={value} onChange={vi.fn()} />);
    expect(screen.getByRole('combobox')).toHaveValue('Newton, MA, United States');
  });

  it('shows dropdown when isOpen is true with suggestions', () => {
    const suggestions = createMockLocationSuggestions(3);
    mockHookState = createMockHookState({
      suggestions,
      isOpen: true,
    });

    render(<LocationAutocomplete value={null} onChange={vi.fn()} />);

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText('Newton, MA, United States')).toBeInTheDocument();
    expect(screen.getByText('New York, NY, United States')).toBeInTheDocument();
    expect(screen.getByText('Newark, NJ, United States')).toBeInTheDocument();
  });

  it('calls onChange when suggestion is clicked', () => {
    const suggestions = createMockLocationSuggestions(3);
    mockHookState = createMockHookState({
      suggestions,
      isOpen: true,
    });

    const onChange = vi.fn();
    render(<LocationAutocomplete value={null} onChange={onChange} />);

    fireEvent.click(screen.getByText('Newton, MA, United States'));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'Newton, MA, United States' })
    );
  });

  it('handles keyboard navigation - ArrowDown', () => {
    const suggestions = createMockLocationSuggestions(3);
    mockHookState = createMockHookState({
      suggestions,
      isOpen: true,
    });

    render(<LocationAutocomplete value={null} onChange={vi.fn()} />);
    const input = screen.getByRole('combobox');

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(mockHookState.highlightNext).toHaveBeenCalled();
  });

  it('handles keyboard navigation - ArrowUp', () => {
    const suggestions = createMockLocationSuggestions(3);
    mockHookState = createMockHookState({
      suggestions,
      isOpen: true,
    });

    render(<LocationAutocomplete value={null} onChange={vi.fn()} />);
    const input = screen.getByRole('combobox');

    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(mockHookState.highlightPrev).toHaveBeenCalled();
  });

  it('handles keyboard navigation - Enter selects highlighted', () => {
    const suggestions = createMockLocationSuggestions(3);
    const highlighted = suggestions[0];
    mockHookState = createMockHookState({
      suggestions,
      isOpen: true,
      highlightedIndex: 0,
      getHighlighted: vi.fn(() => highlighted),
    });

    const onChange = vi.fn();
    render(<LocationAutocomplete value={null} onChange={onChange} />);
    const input = screen.getByRole('combobox');

    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith(highlighted);
  });

  it('handles keyboard navigation - Escape closes dropdown', () => {
    const suggestions = createMockLocationSuggestions(3);
    mockHookState = createMockHookState({
      suggestions,
      isOpen: true,
    });

    render(<LocationAutocomplete value={null} onChange={vi.fn()} />);
    const input = screen.getByRole('combobox');

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(mockHookState.close).toHaveBeenCalled();
  });

  it('shows clear button when value is set', () => {
    const value = createMockLocationSuggestion();
    render(<LocationAutocomplete value={value} onChange={vi.fn()} />);

    const clearBtn = screen.getByLabelText('Clear location');
    expect(clearBtn).toBeInTheDocument();
  });

  it('clears value when clear button is clicked', () => {
    const value = createMockLocationSuggestion();
    const onChange = vi.fn();
    render(<LocationAutocomplete value={value} onChange={onChange} />);

    fireEvent.click(screen.getByLabelText('Clear location'));

    expect(onChange).toHaveBeenCalledWith(null);
    expect(mockHookState.clearSuggestions).toHaveBeenCalled();
  });

  it('does not show clear button when disabled', () => {
    const value = createMockLocationSuggestion();
    render(<LocationAutocomplete value={value} onChange={vi.fn()} disabled />);

    expect(screen.queryByLabelText('Clear location')).not.toBeInTheDocument();
  });

  it('shows loading indicator when isLoading is true', () => {
    mockHookState = createMockHookState({ isLoading: true });

    render(<LocationAutocomplete value={null} onChange={vi.fn()} />);

    // The loading spinner has aria-hidden="true" so we check for the spinning class
    const loadingSpinner = document.querySelector('.location-loading');
    expect(loadingSpinner).toBeInTheDocument();
  });

  it('shows no results message when dropdown is open with no suggestions', () => {
    mockHookState = createMockHookState({
      suggestions: [],
      isOpen: true,
      isLoading: false,
    });

    render(<LocationAutocomplete value={null} onChange={vi.fn()} />);

    // Use listbox to find the no results message (not the aria-live region)
    const listbox = screen.getByRole('listbox');
    expect(listbox).toHaveTextContent('No locations found');
  });

  it('shows error state with retry button', () => {
    mockHookState = createMockHookState({
      suggestions: [],
      isOpen: true,
      error: 'Failed to fetch',
    });

    render(<LocationAutocomplete value={null} onChange={vi.fn()} />);

    expect(screen.getByText("Couldn't load suggestions")).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('calls search when typing', () => {
    render(<LocationAutocomplete value={null} onChange={vi.fn()} />);
    const input = screen.getByRole('combobox');

    fireEvent.change(input, { target: { value: 'new' } });

    expect(mockHookState.search).toHaveBeenCalledWith('new');
  });

  it('clears suggestions when input is cleared', () => {
    const onChange = vi.fn();
    render(<LocationAutocomplete value={null} onChange={onChange} />);
    const input = screen.getByRole('combobox');

    // First type something
    fireEvent.change(input, { target: { value: 'new' } });
    expect(mockHookState.search).toHaveBeenCalledWith('new');

    // Then clear it
    fireEvent.change(input, { target: { value: '' } });

    expect(mockHookState.clearSuggestions).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('has correct ARIA attributes', () => {
    mockHookState = createMockHookState({
      suggestions: createMockLocationSuggestions(3),
      isOpen: true,
      highlightedIndex: 1,
    });

    render(<LocationAutocomplete value={null} onChange={vi.fn()} />);

    const input = screen.getByRole('combobox');
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(input).toHaveAttribute('aria-controls');

    const listbox = screen.getByRole('listbox');
    expect(listbox).toBeInTheDocument();

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('disables input when disabled prop is true', () => {
    render(<LocationAutocomplete value={null} onChange={vi.fn()} disabled />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('shows validation message on blur without selection', async () => {
    render(<LocationAutocomplete value={null} onChange={vi.fn()} />);
    const input = screen.getByRole('combobox');

    // Type something
    fireEvent.change(input, { target: { value: 'newt' } });

    // Blur without selecting
    fireEvent.blur(input);

    // Wait for the timeout in handleBlur
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Select a location from the list');
    }, { timeout: 300 });
  });

  it('does not show validation message when value is selected', async () => {
    const value = createMockLocationSuggestion();
    render(<LocationAutocomplete value={value} onChange={vi.fn()} />);
    const input = screen.getByRole('combobox');

    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    }, { timeout: 300 });
  });
});
