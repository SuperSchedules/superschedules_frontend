import { useState } from 'react';
import DateRangePicker from './DateRangePicker';
import LocationAutocomplete from './LocationAutocomplete';
import type { LocationSuggestion } from '../types/index';
import './SearchPreferencesBar.css';

interface SearchPreferencesBarProps {
  dateFrom: string;
  dateTo: string;
  onDateChange: (range: { from: string; to: string }) => void;
  location?: LocationSuggestion | null;
  onLocationChange?: (location: LocationSuggestion | null) => void;
  ageMin?: number;
  ageMax?: number;
  onAgeChange?: (min: number, max: number) => void;
  maxPrice?: number;
  onMaxPriceChange?: (price: number) => void;
}

export default function SearchPreferencesBar({
  dateFrom,
  dateTo,
  onDateChange,
  location = null,
  onLocationChange,
  ageMin = 0,
  ageMax = 18,
  onAgeChange,
  maxPrice = 100,
  onMaxPriceChange
}: SearchPreferencesBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="search-preferences-bar">
      <div className="preferences-row-main">
        <DateRangePicker
          from={dateFrom}
          to={dateTo}
          onChange={onDateChange}
        />

        <button
          className="expand-filters-btn"
          onClick={() => setIsExpanded(!isExpanded)}
          title="More filters"
        >
          {isExpanded ? '▼' : '▶'} Filters
        </button>
      </div>

      {isExpanded && (
        <div className="preferences-row-expanded">
          <div className="filter-group">
            <label htmlFor="location-input">Location:</label>
            <LocationAutocomplete
              id="location-input"
              value={location}
              onChange={(loc) => onLocationChange?.(loc)}
              placeholder="City or town..."
            />
          </div>

          <div className="filter-group">
            <label htmlFor="age-min">Ages:</label>
            <div className="age-inputs">
              <input
                id="age-min"
                type="number"
                value={ageMin}
                onChange={(e) => onAgeChange?.(parseInt(e.target.value) || 0, ageMax)}
                min="0"
                max="99"
                className="filter-input-small"
              />
              <span>to</span>
              <input
                id="age-max"
                type="number"
                value={ageMax}
                onChange={(e) => onAgeChange?.(ageMin, parseInt(e.target.value) || 18)}
                min="0"
                max="99"
                className="filter-input-small"
              />
            </div>
          </div>

          <div className="filter-group">
            <label htmlFor="max-price">Max Price: ${maxPrice}</label>
            <input
              id="max-price"
              type="range"
              value={maxPrice}
              onChange={(e) => onMaxPriceChange?.(parseInt(e.target.value))}
              min="0"
              max="200"
              step="5"
              className="filter-slider"
            />
          </div>
        </div>
      )}
    </div>
  );
}
