import { useId, useRef, useEffect, useState, useCallback } from 'react';
import { useLocationAutocomplete } from '../hooks/useLocationAutocomplete';
import type { LocationSuggestion } from '../types/index';
import './LocationAutocomplete.css';

// Strip "town", "CDP", "city" suffixes and abbreviate country for cleaner display
function formatDisplayLabel(label: string): string {
  return label
    .replace(/\s+(town|CDP|city),/gi, ',')
    .replace(/\s+(town|CDP|city)$/gi, '')
    .replace(/,\s*United States$/i, ', USA');
}

interface LocationAutocompleteProps {
  value: LocationSuggestion | null;
  onChange: (location: LocationSuggestion | null) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
}

export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = 'City or town...',
  disabled = false,
  id: externalId,
  'aria-label': ariaLabel,
}: LocationAutocompleteProps) {
  const generatedId = useId();
  const inputId = externalId || `location-input-${generatedId}`;
  const listboxId = `${inputId}-listbox`;

  const [inputValue, setInputValue] = useState<string>(value ? formatDisplayLabel(value.label) : '');
  const [validationMessage, setValidationMessage] = useState<string>('');
  const [dropdownTop, setDropdownTop] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const hasSelectionRef = useRef<boolean>(!!value);

  const updateDropdownPosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownTop(rect.bottom);
    }
  }, []);

  const {
    suggestions,
    isLoading,
    error,
    isOpen,
    highlightedIndex,
    search,
    close,
    open,
    highlightNext,
    highlightPrev,
    getHighlighted,
    clearSuggestions,
    retry,
  } = useLocationAutocomplete({ debounceMs: 250, minChars: 2, maxResults: 8 });

  useEffect(() => {
    setInputValue(value ? formatDisplayLabel(value.label) : '');
    hasSelectionRef.current = !!value;
    setValidationMessage('');
  }, [value]);

  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listboxRef.current) {
      const item = listboxRef.current.children[highlightedIndex] as HTMLElement;
      if (item?.scrollIntoView) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    hasSelectionRef.current = false;
    setValidationMessage('');
    updateDropdownPosition();

    if (newValue.trim()) {
      search(newValue);
    } else {
      clearSuggestions();
      onChange(null);
    }
  };

  const handleSelect = (suggestion: LocationSuggestion) => {
    setInputValue(formatDisplayLabel(suggestion.label));
    hasSelectionRef.current = true;
    setValidationMessage('');
    onChange(suggestion);
    close();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen && suggestions.length > 0) {
          open();
        } else {
          highlightNext();
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        highlightPrev();
        break;
      case 'Enter': {
        e.preventDefault();
        const highlighted = getHighlighted();
        if (highlighted) {
          handleSelect(highlighted);
        }
        break;
      }
      case 'Escape':
        e.preventDefault();
        close();
        break;
      case 'Tab':
        close();
        break;
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      close();

      if (inputRef.current?.value.trim() && !hasSelectionRef.current) {
        setValidationMessage('Select a location from the list');
      }
    }, 200);
  };

  const handleFocus = () => {
    updateDropdownPosition();
    if (suggestions.length > 0) {
      open();
    }
  };

  const handleClear = () => {
    setInputValue('');
    hasSelectionRef.current = false;
    setValidationMessage('');
    onChange(null);
    clearSuggestions();
    inputRef.current?.focus();
  };

  const handleRetry = () => {
    if (inputValue.trim()) {
      retry(inputValue);
    }
  };

  return (
    <div className="location-autocomplete">
      <div className="location-input-wrapper">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={isOpen}
          aria-activedescendant={
            isOpen && highlightedIndex >= 0
              ? `${listboxId}-option-${highlightedIndex}`
              : undefined
          }
          aria-label={ariaLabel}
          aria-invalid={!!validationMessage}
          aria-describedby={validationMessage ? `${inputId}-error` : undefined}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={`filter-input ${validationMessage ? 'has-error' : ''} ${value ? 'has-value' : ''}`}
          autoComplete="off"
        />

        {isLoading && (
          <span className="location-loading" aria-hidden="true">
            <i className="bi bi-arrow-repeat spinning"></i>
          </span>
        )}

        {value && !disabled && !isLoading && (
          <button
            type="button"
            className="location-clear-btn"
            onClick={handleClear}
            aria-label="Clear location"
            tabIndex={-1}
          >
            <i className="bi bi-x"></i>
          </button>
        )}
      </div>

      {validationMessage && (
        <span id={`${inputId}-error`} className="location-error" role="alert">
          {validationMessage}
        </span>
      )}

      {isOpen && (
        <ul
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          aria-label="Location suggestions"
          className="location-suggestions"
          style={dropdownTop !== null ? { top: dropdownTop } : undefined}
        >
          {error ? (
            <li className="location-error-item" role="status">
              <span>Couldn't load suggestions</span>
              <button
                type="button"
                className="location-retry-btn"
                onClick={handleRetry}
              >
                Retry
              </button>
            </li>
          ) : suggestions.length === 0 && !isLoading ? (
            <li className="location-no-results" role="status">
              No locations found
            </li>
          ) : (
            suggestions.map((suggestion, index) => (
              <li
                key={suggestion.id}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={highlightedIndex === index}
                className={`location-suggestion ${highlightedIndex === index ? 'highlighted' : ''}`}
                onClick={() => handleSelect(suggestion)}
              >
                <i className="bi bi-geo-alt" aria-hidden="true"></i>
                <span>{formatDisplayLabel(suggestion.label)}</span>
              </li>
            ))
          )}
        </ul>
      )}

      <div className="visually-hidden" aria-live="polite" aria-atomic="true">
        {isOpen && suggestions.length > 0 && (
          `${suggestions.length} location${suggestions.length !== 1 ? 's' : ''} found`
        )}
        {isOpen && suggestions.length === 0 && !isLoading && !error && 'No locations found'}
        {error && 'Error loading suggestions'}
      </div>
    </div>
  );
}
