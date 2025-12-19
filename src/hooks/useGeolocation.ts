import { useState, useCallback } from 'react';

interface GeolocationState {
  location: { lat: number; lng: number } | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to get user's browser geolocation
 * Does NOT auto-request on mount (browsers require user gesture)
 * Call requestLocation() in response to a user action (click, etc.)
 */
export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    loading: false,
    error: null,
  });

  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState({
        location: null,
        loading: false,
        error: 'Geolocation not supported',
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          loading: false,
          error: null,
        });
      },
      (error) => {
        // Don't show error to user - just silently fall back to null
        console.debug('Geolocation permission denied or unavailable:', error.message);
        setState({
          location: null,
          loading: false,
          error: null,
        });
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }, []);

  return { ...state, requestLocation };
};
