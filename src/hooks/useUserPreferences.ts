import { useState, useEffect } from 'react';
import type { UserPreferences } from '../types/index';

const PREFERENCES_STORAGE_KEY = 'superschedules_user_preferences';

/**
 * Get max search distance in miles based on transportation preference
 */
export const getMaxDistanceFromTransportation = (transport?: string): number | null => {
  switch (transport) {
    case 'walking': return 2;
    case 'public': return 15;
    case 'driving': return 30;
    default: return null; // 'any' or undefined = no limit
  }
};

const getDefaultPreferences = (): UserPreferences => ({
  interests: [],
  preferredTimes: 'any',
  transportation: 'any'
});

export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const defaults = getDefaultPreferences();
        return { ...defaults, ...parsed };
      }
      return getDefaultPreferences();
    } catch (error) {
      console.warn('Failed to load user preferences:', error);
      return getDefaultPreferences();
    }
  });

  // Persist preferences to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to save user preferences:', error);
    }
  }, [preferences]);

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  };

  const resetPreferences = () => {
    setPreferences(getDefaultPreferences());
    localStorage.removeItem(PREFERENCES_STORAGE_KEY);
  };

  // Helper to generate a user context string for the chat
  const getPreferencesContext = (): string => {
    const context: string[] = [];
    
    if (preferences.age) {
      context.push(`Age: ${preferences.age}`);
    }
    
    if (preferences.familySize && preferences.familySize > 1) {
      context.push(`Family size: ${preferences.familySize} people`);
    }

    if (preferences.interests && preferences.interests.length > 0) {
      context.push(`Interests: ${preferences.interests.join(', ')}`);
    }

    if (preferences.accessibility && preferences.accessibility.length > 0) {
      context.push(`Accessibility needs: ${preferences.accessibility.join(', ')}`);
    }
    
    if (preferences.transportation && preferences.transportation !== 'any') {
      context.push(`Transportation: ${preferences.transportation}`);
    }
    
    if (preferences.preferredTimes && preferences.preferredTimes !== 'any') {
      context.push(`Preferred time: ${preferences.preferredTimes}`);
    }

    return context.length > 0 
      ? `User preferences: ${context.join('; ')}`
      : '';
  };

  return {
    preferences,
    updatePreferences,
    resetPreferences,
    getPreferencesContext
  };
};