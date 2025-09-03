import { useUserPreferences } from '../hooks/useUserPreferences';
import type { UserPreferences as UserPreferencesType } from '../types/index';

interface UserPreferencesProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMMON_INTERESTS = [
  'Music', 'Sports', 'Arts & Crafts', 'Food & Drink', 'Outdoor Activities',
  'Family Events', 'Education', 'Theater', 'Technology', 'Health & Fitness',
  'Community', 'Literature', 'Film', 'Dance', 'Festivals'
];

const ACCESSIBILITY_OPTIONS = [
  'Wheelchair accessible', 'ASL interpretation', 'Audio description',
  'Large print materials', 'Quiet space available', 'Service animals welcome'
];

export default function UserPreferences({ isOpen, onClose }: UserPreferencesProps) {
  const { preferences, updatePreferences, resetPreferences } = useUserPreferences();

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
  };

  const toggleInterest = (interest: string) => {
    const interests = preferences.interests || [];
    const updated = interests.includes(interest)
      ? interests.filter(i => i !== interest)
      : [...interests, interest];
    updatePreferences({ interests: updated });
  };

  const toggleAccessibility = (option: string) => {
    const accessibility = preferences.accessibility || [];
    const updated = accessibility.includes(option)
      ? accessibility.filter(a => a !== option)
      : [...accessibility, option];
    updatePreferences({ accessibility: updated });
  };

  const toggleBudgetRange = (range: 'free' | 'low' | 'medium' | 'high') => {
    const budgetRange = preferences.budgetRange || [];
    const updated = budgetRange.includes(range)
      ? budgetRange.filter(r => r !== range)
      : [...budgetRange, range];
    updatePreferences({ budgetRange: updated });
  };

  return (
    <div className="preferences-overlay">
      <div className="preferences-modal">
        <div className="preferences-header">
          <h3>Your Event Preferences</h3>
          <div className="header-info">
            <span className="auto-save-note">Changes saved automatically</span>
            <button className="close-btn" onClick={handleClose}>×</button>
          </div>
        </div>
        
        <div className="preferences-content">
          <div className="preference-section">
            <label>
              Age:
              <input
                type="number"
                min="1"
                max="120"
                value={preferences.age || ''}
                onChange={(e) => updatePreferences({ 
                  age: e.target.value ? parseInt(e.target.value) : undefined 
                })}
                placeholder="Your age"
              />
            </label>
          </div>

          <div className="preference-section">
            <label>
              Location:
              <input
                type="text"
                value={preferences.location || ''}
                onChange={(e) => updatePreferences({ location: e.target.value })}
                placeholder="City or area (e.g., Boston, Cambridge)"
              />
            </label>
          </div>

          <div className="preference-section">
            <label>
              Family Size:
              <input
                type="number"
                min="1"
                max="20"
                value={preferences.familySize || ''}
                onChange={(e) => updatePreferences({ 
                  familySize: e.target.value ? parseInt(e.target.value) : undefined 
                })}
                placeholder="Number of people"
              />
            </label>
          </div>

          <div className="preference-section">
            <fieldset className="budget-fieldset">
              <legend>Budget Range (select multiple)</legend>
              <div className="budget-range-grid" role="group" aria-labelledby="budget-legend">
                {[
                  { value: 'free', label: 'Free events', description: '$0' },
                  { value: 'low', label: 'Low cost', description: '$1-25' },
                  { value: 'medium', label: 'Medium cost', description: '$25-75' },
                  { value: 'high', label: 'Higher cost', description: '$75+' }
                ].map(({ value, label, description }) => {
                  const isSelected = (preferences.budgetRange || []).includes(value as any);
                  return (
                    <button
                      key={value}
                      type="button"
                      role="checkbox"
                      aria-checked={isSelected}
                      aria-label={`${label}, ${description}${isSelected ? ', selected' : ', not selected'}`}
                      className={`budget-tag ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleBudgetRange(value as 'free' | 'low' | 'medium' | 'high')}
                    >
                      <div className="budget-label" aria-hidden="true">{label}</div>
                      <div className="budget-description" aria-hidden="true">{description}</div>
                      <span className="sr-only">
                        {isSelected ? 'Selected' : 'Not selected'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>

          <div className="preference-section">
            <label>Preferred Time:</label>
            <select
              value={preferences.preferredTimes || 'any'}
              onChange={(e) => updatePreferences({ 
                preferredTimes: e.target.value as UserPreferencesType['preferredTimes']
              })}
            >
              <option value="any">Any time</option>
              <option value="morning">Morning (before 12pm)</option>
              <option value="afternoon">Afternoon (12pm-6pm)</option>
              <option value="evening">Evening (after 6pm)</option>
            </select>
          </div>

          <div className="preference-section">
            <label>Transportation:</label>
            <select
              value={preferences.transportation || 'any'}
              onChange={(e) => updatePreferences({ 
                transportation: e.target.value as UserPreferencesType['transportation']
              })}
            >
              <option value="any">Any</option>
              <option value="walking">Walking distance</option>
              <option value="driving">Driving</option>
              <option value="public">Public transportation</option>
            </select>
          </div>

          <div className="preference-section">
            <fieldset className="interests-fieldset">
              <legend>Interests (select multiple)</legend>
              <div className="interests-grid" role="group">
                {COMMON_INTERESTS.map(interest => {
                  const isSelected = (preferences.interests || []).includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      role="checkbox"
                      aria-checked={isSelected}
                      className={`interest-tag ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleInterest(interest)}
                    >
                      {interest}
                      <span className="sr-only">
                        {isSelected ? ', selected' : ', not selected'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>

          <div className="preference-section">
            <fieldset className="accessibility-fieldset">
              <legend>Accessibility Needs (select multiple)</legend>
              <div className="accessibility-grid" role="group">
                {ACCESSIBILITY_OPTIONS.map(option => {
                  const isSelected = (preferences.accessibility || []).includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      role="checkbox"
                      aria-checked={isSelected}
                      className={`accessibility-tag ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleAccessibility(option)}
                    >
                      {option}
                      <span className="sr-only">
                        {isSelected ? ', selected' : ', not selected'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>
        </div>

        <div className="preferences-footer">
          <button className="reset-btn" onClick={resetPreferences}>
            Reset to Defaults
          </button>
          <div className="action-buttons">
            <button className="close-btn-footer" onClick={handleClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}