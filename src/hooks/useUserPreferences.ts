import { useState, useEffect } from 'react';
import type { UserPreferences } from '../types/index';

const PREFERENCES_STORAGE_KEY = 'superschedules_user_preferences';

const getDefaultPreferences = (): UserPreferences => ({
  interests: [],
  preferredTimes: 'any',
  transportation: 'any',
  budgetRange: 'medium'
});

export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      return stored ? { ...getDefaultPreferences(), ...JSON.parse(stored) } : getDefaultPreferences();
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
    
    if (preferences.location) {
      context.push(`Location: ${preferences.location}`);
    }
    
    if (preferences.interests && preferences.interests.length > 0) {
      context.push(`Interests: ${preferences.interests.join(', ')}`);
    }
    
    if (preferences.budgetRange && preferences.budgetRange !== 'medium') {
      context.push(`Budget: ${preferences.budgetRange}`);
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