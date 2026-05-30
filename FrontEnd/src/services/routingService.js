import axios from 'axios';

const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY;
const ORS_BASE_URL = 'https://api.openrouteservice.org/v2/directions/driving-car';

/**
 * Fetches route details between two coordinates.
 * Coordinates should be in [longitude, latitude] format for ORS.
 * 
 * @param {Array} startCoord [lng, lat]
 * @param {Array} endCoord [lng, lat]
 * @returns {Promise<Object>} { polyline, distance, duration }
 */
export const fetchRoute = async (startCoord, endCoord) => {
  if (!ORS_API_KEY) {
    console.warn('VITE_ORS_API_KEY is missing. Mocking route data for MVP.');
    return mockRoute(startCoord, endCoord);
  }

  try {
    const response = await axios.get(ORS_BASE_URL, {
      params: {
        api_key: ORS_API_KEY,
        start: `${startCoord[0]},${startCoord[1]}`,
        end: `${endCoord[0]},${endCoord[1]}`,
      }
    });

    const feature = response.data.features[0];
    const geometry = feature.geometry; // GeoJSON LineString
    const properties = feature.properties;

    // Convert GeoJSON coordinates [lng, lat] to Leaflet [lat, lng]
    const polyline = geometry.coordinates.map(coord => [coord[1], coord[0]]);

    return {
      polyline,
      distance: properties.segments[0].distance, // in meters
      duration: properties.segments[0].duration, // in seconds
    };
  } catch (error) {
    console.error('Error fetching route from ORS:', error);
    throw error;
  }
};

/**
 * Fallback for when API key is missing.
 * Generates a simple straight line and estimates distance using Haversine.
 */
const mockRoute = async (startCoord, endCoord) => {
  try {
    // Try to use public OSRM server for a real road route
    const response = await axios.get(`https://router.project-osrm.org/route/v1/driving/${startCoord[0]},${startCoord[1]};${endCoord[0]},${endCoord[1]}?overview=full&geometries=geojson`);
    
    if (response.data && response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      const geometry = route.geometry;
      // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
      const polyline = geometry.coordinates.map(coord => [coord[1], coord[0]]);
      
      return {
        polyline,
        distance: route.distance, // meters
        duration: route.duration  // seconds
      };
    }
  } catch (err) {
    console.warn("OSRM public API failed, falling back to straight line", err);
  }

  const polyline = [
    [startCoord[1], startCoord[0]],
    [endCoord[1], endCoord[0]]
  ];
  
  // Approximate distance (rough calculation for mock)
  const dx = endCoord[0] - startCoord[0];
  const dy = endCoord[1] - startCoord[1];
  const distanceDeg = Math.sqrt(dx*dx + dy*dy);
  const distance = distanceDeg * 111000; // rough meters
  
  // Estimate speed at 30km/h (8.33 m/s)
  const duration = distance / 8.33; 

  return {
    polyline,
    distance,
    duration
  };
};
