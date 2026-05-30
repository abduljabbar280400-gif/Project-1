import { useState, useEffect } from 'react';

/**
 * Custom hook for accessing the browser's geolocation API.
 * 
 * @param {Object} options - Geolocation options (enableHighAccuracy, timeout, maximumAge)
 * @param {boolean} watch - If true, it will use watchPosition instead of getCurrentPosition
 * @returns {Object} { location, error, loading }
 */
export const useGeolocation = (options = {}, watch = false) => {
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    accuracy: null,
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let watchId;

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    const handleSuccess = (position) => {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
      setError(null);
      setLoading(false);
    };

    const handleError = (error) => {
      setError(error.message);
      setLoading(false);
    };

    setLoading(true);

    if (watch) {
      watchId = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        options
      );
    } else {
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        options
      );
    }

    return () => {
      if (watch && watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watch, options.enableHighAccuracy, options.timeout, options.maximumAge]);

  return { location, error, loading };
};
