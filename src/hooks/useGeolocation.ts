import { useState, useEffect } from 'react';

interface GeolocationState {
  location: { lat: number; lng: number } | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to get user's browser geolocation
 * Requests permission on mount and caches the result
 */
export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setState({
        location: null,
        loading: false,
        error: 'Geolocation not supported',
      });
      return;
    }

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
          error: null, // Intentionally not exposing error to UI
        });
      },
      {
        enableHighAccuracy: false, // Lower accuracy for faster response
        timeout: 10000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    );
  }, []);

  return state;
};
