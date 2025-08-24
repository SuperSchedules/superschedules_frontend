import { useState } from 'react';
import { useUserPreferences } from '../hooks/useUserPreferences.js';
import type { UserPreferences as UserPreferencesType } from '../types/index.js';

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
  const [localPrefs, setLocalPrefs] = useState<UserPreferencesType>(preferences);

  if (!isOpen) return null;

  const handleSave = () => {
    updatePreferences(localPrefs);
    onClose();
  };

  const handleCancel = () => {
    setLocalPrefs(preferences);
    onClose();
  };

  const toggleInterest = (interest: string) => {
    const interests = localPrefs.interests || [];
    const updated = interests.includes(interest)
      ? interests.filter(i => i !== interest)
      : [...interests, interest];
    setLocalPrefs({ ...localPrefs, interests: updated });
  };

  const toggleAccessibility = (option: string) => {
    const accessibility = localPrefs.accessibility || [];
    const updated = accessibility.includes(option)
      ? accessibility.filter(a => a !== option)
      : [...accessibility, option];
    setLocalPrefs({ ...localPrefs, accessibility: updated });
  };

  return (
    <div className="preferences-overlay">
      <div className="preferences-modal">
        <div className="preferences-header">
          <h3>Your Event Preferences</h3>
          <button className="close-btn" onClick={handleCancel}>×</button>
        </div>
        
        <div className="preferences-content">
          <div className="preference-section">
            <label>
              Age:
              <input
                type="number"
                min="1"
                max="120"
                value={localPrefs.age || ''}
                onChange={(e) => setLocalPrefs({ 
                  ...localPrefs, 
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
                value={localPrefs.location || ''}
                onChange={(e) => setLocalPrefs({ ...localPrefs, location: e.target.value })}
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
                value={localPrefs.familySize || ''}
                onChange={(e) => setLocalPrefs({ 
                  ...localPrefs, 
                  familySize: e.target.value ? parseInt(e.target.value) : undefined 
                })}
                placeholder="Number of people"
              />
            </label>
          </div>

          <div className="preference-section">
            <label>Budget Range:</label>
            <select
              value={localPrefs.budgetRange || 'medium'}
              onChange={(e) => setLocalPrefs({ 
                ...localPrefs, 
                budgetRange: e.target.value as UserPreferencesType['budgetRange']
              })}
            >
              <option value="free">Free events only</option>
              <option value="low">Low cost ($1-25)</option>
              <option value="medium">Medium cost ($25-75)</option>
              <option value="high">Higher cost ($75+)</option>
            </select>
          </div>

          <div className="preference-section">
            <label>Preferred Time:</label>
            <select
              value={localPrefs.preferredTimes || 'any'}
              onChange={(e) => setLocalPrefs({ 
                ...localPrefs, 
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
              value={localPrefs.transportation || 'any'}
              onChange={(e) => setLocalPrefs({ 
                ...localPrefs, 
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
            <label>Interests:</label>
            <div className="interests-grid">
              {COMMON_INTERESTS.map(interest => (
                <button
                  key={interest}
                  type="button"
                  className={`interest-tag ${(localPrefs.interests || []).includes(interest) ? 'selected' : ''}`}
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          <div className="preference-section">
            <label>Accessibility Needs:</label>
            <div className="accessibility-grid">
              {ACCESSIBILITY_OPTIONS.map(option => (
                <button
                  key={option}
                  type="button"
                  className={`accessibility-tag ${(localPrefs.accessibility || []).includes(option) ? 'selected' : ''}`}
                  onClick={() => toggleAccessibility(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="preferences-footer">
          <button className="reset-btn" onClick={() => {
            resetPreferences();
            setLocalPrefs({});
          }}>
            Reset to Defaults
          </button>
          <div className="action-buttons">
            <button className="cancel-btn" onClick={handleCancel}>
              Cancel
            </button>
            <button className="save-btn" onClick={handleSave}>
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}