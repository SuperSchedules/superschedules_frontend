import { useUserPreferences } from '../hooks/useUserPreferences';
import type { UserPreferences as UserPreferencesType } from '../types/index';
import { useTheme } from '../contexts/ThemeContext';
import type { ThemeType } from '../contexts/ThemeContext';
import './UserPreferences.css';

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
  const { theme, setTheme } = useTheme();
  const isZombieTheme = theme === 'zombie-light' || theme === 'zombie-dark';

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

  return (
    <div className="preferences-overlay" onClick={handleClose}>
      <div className="preferences-modal" onClick={(e) => e.stopPropagation()}>
        <div className="preferences-header">
          <h3>{isZombieTheme ? '🧟 Your Zombie Preferences' : 'Your Preferences'}</h3>
          <div className="header-info">
            <span className="auto-save-note">{isZombieTheme ? '✨ Auto-saved to your brain' : 'Auto-saved locally'}</span>
            <button className="close-btn" onClick={handleClose} aria-label="Close preferences">×</button>
          </div>
        </div>

        <div className="preferences-content">
          {/* Appearance Section */}
          <div className="pref-section-card">
            <h4 className="section-title">Appearance</h4>
            <div className="section-content">
              <div className="form-row">
                <label htmlFor="pref-theme" className="row-label">Theme</label>
                <div className="row-control">
                  <select
                    id="pref-theme"
                    className="form-select"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as ThemeType)}
                  >
                    <option value="light">Light (Professional)</option>
                    <option value="dark">Dark (Professional)</option>
                    <option value="zombie-light">Zombie Light (Fun)</option>
                    <option value="zombie-dark">Zombie Dark (Fun)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Basic Info Section */}
          <div className="pref-section-card">
            <h4 className="section-title">Basic Information</h4>
            <div className="section-content">
              <div className="form-row">
                <label htmlFor="pref-age" className="row-label">Age</label>
                <div className="row-control">
                  <input
                    id="pref-age"
                    type="number"
                    min="1"
                    max="120"
                    value={preferences.age || ''}
                    onChange={(e) => updatePreferences({
                      age: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    placeholder="Your age"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <label htmlFor="pref-family" className="row-label">Family Size</label>
                <div className="row-control">
                  <input
                    id="pref-family"
                    type="number"
                    min="1"
                    max="20"
                    value={preferences.familySize || ''}
                    onChange={(e) => updatePreferences({
                      familySize: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    placeholder="Number of people"
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Event Preferences Section */}
          <div className="pref-section-card">
            <h4 className="section-title">Event Preferences</h4>
            <div className="section-content">
              <div className="form-row">
                <label htmlFor="pref-time" className="row-label">Preferred Time</label>
                <div className="row-control">
                  <select
                    id="pref-time"
                    className="form-select"
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
              </div>

              <div className="form-row">
                <label htmlFor="pref-transport" className="row-label">Transportation</label>
                <div className="row-control">
                  <select
                    id="pref-transport"
                    className="form-select"
                    value={preferences.transportation || 'any'}
                    onChange={(e) => updatePreferences({
                      transportation: e.target.value as UserPreferencesType['transportation']
                    })}
                  >
                    <option value="any">Any</option>
                    <option value="walking">Walking distance</option>
                    <option value="driving">Driving</option>
                    <option value="public">Public transit</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Interests Section */}
          <div className="pref-section-card">
            <h4 className="section-title">Interests</h4>
            <div className="section-content">
              <div className="option-tags">
                {COMMON_INTERESTS.map(interest => {
                  const isSelected = (preferences.interests || []).includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      className={`option-tag ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleInterest(interest)}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Accessibility Section */}
          <div className="pref-section-card">
            <h4 className="section-title">Accessibility</h4>
            <div className="section-content">
              <div className="option-tags">
                {ACCESSIBILITY_OPTIONS.map(option => {
                  const isSelected = (preferences.accessibility || []).includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      className={`option-tag ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleAccessibility(option)}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="privacy-notice">
          <p>
            <strong>Privacy:</strong> Your preferences are stored locally in your browser.
            When you chat with our AI assistant, these preferences are sent with your messages
            to provide personalized event recommendations and will be logged in our system.
          </p>
        </div>

        <div className="preferences-footer">
          <button className="btn-reset" onClick={resetPreferences}>
            Reset to Defaults
          </button>
          <button className="btn-close" onClick={handleClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}