import L from 'leaflet';

// Fix for default marker icons in Leaflet with Vite/Webpack
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

export const fixLeafletIcons = () => {
  delete L.Icon.Default.prototype._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: iconRetinaUrl,
    iconUrl: iconUrl,
    shadowUrl: shadowUrl,
  });
};

export const createEmojiIcon = (emoji, bgColor = '#10b981') => {
  return L.divIcon({
    className: 'custom-leaflet-icon-emoji',
    html: `<div style="background-color: ${bgColor}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 16px; font-family: sans-serif;">${emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

export const Icons = {
  Restaurant: createEmojiIcon('🏪', '#f59e0b'), // Amber
  Customer: createEmojiIcon('🏠', '#3b82f6'),   // Blue
  Driver: createEmojiIcon('🛵', '#10b981'),     // Green
};
