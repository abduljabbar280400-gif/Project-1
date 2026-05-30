import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { Icons } from './MapConfig';
import { FiCrosshair } from 'react-icons/fi';

// Helper to handle map clicks
function MapClickEvents({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

// Helper to change center
function MapCenterControl({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, map.getZoom() < 14 ? 14 : map.getZoom());
    }
  }, [center, map]);
  return null;
}

export default function LocationPickerMap({ pincode, initialLocation, onLocationSelect }) {
  const [markerPosition, setMarkerPosition] = useState(
    initialLocation?.latitude ? { lat: initialLocation.latitude, lng: initialLocation.longitude } : null
  );
  const [mapCenter, setMapCenter] = useState(
    initialLocation?.latitude ? { lat: initialLocation.latitude, lng: initialLocation.longitude } : { lat: 51.505, lng: -0.09 }
  );

  const [loadingLocation, setLoadingLocation] = useState(false);

  useEffect(() => {
    if (initialLocation?.latitude) {
      const pos = { lat: initialLocation.latitude, lng: initialLocation.longitude };
      setMarkerPosition(pos);
      setMapCenter(pos);
    } else {
      setMarkerPosition(null);
    }
  }, [initialLocation?.latitude, initialLocation?.longitude]);

  useEffect(() => {
    // If pincode changes and we don't have a marker yet, geocode the pincode to center the map
    if (pincode && pincode.length >= 4 && !markerPosition) {
      const fetchArea = async () => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${pincode}&limit=1`);
          const data = await res.json();
          if (data && data.length > 0) {
            setMapCenter({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
          }
        } catch (e) {
          console.error("Geocoding failed", e);
        }
      };
      const timeout = setTimeout(fetchArea, 1000);
      return () => clearTimeout(timeout);
    }
  }, [pincode, markerPosition]);

  const handleMapClick = (latlng) => {
    setMarkerPosition(latlng);
    onLocationSelect(latlng.lat, latlng.lng);
  };

  const handleUseCurrentLocation = (e) => {
    e.preventDefault();
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMarkerPosition(newPos);
        setMapCenter(newPos);
        onLocationSelect(newPos.lat, newPos.lng);
        setLoadingLocation(false);
      },
      (err) => {
        alert("Failed to get location. Please allow location permissions.");
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="w-full space-y-2 pb-2">
      <div className="flex justify-between items-end">
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Pick Exact Location</span>
          <span className="block text-[9px] font-semibold text-neutral-400 mt-0.5">Tap the map to set a pin</span>
        </div>
        <button 
          onClick={handleUseCurrentLocation}
          disabled={loadingLocation}
          className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-colors bg-neutral-100 text-neutral-600 border border-neutral-200 shadow-sm cursor-pointer disabled:opacity-50"
        >
          <FiCrosshair size={12} /> {loadingLocation ? 'Locating...' : 'Use Current Location'}
        </button>
      </div>
      <div className="w-full h-48 md:h-64 rounded-xl overflow-hidden shadow-inner border border-neutral-200 relative z-0">
        <MapContainer 
          center={mapCenter} 
          zoom={13} 
          scrollWheelZoom={true} 
          style={{ height: '100%', width: '100%', zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapCenterControl center={mapCenter} />
          <MapClickEvents onMapClick={handleMapClick} />
          {markerPosition && (
            <Marker position={markerPosition} icon={Icons.Customer} />
          )}
        </MapContainer>
        {!markerPosition && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-white/10 backdrop-blur-[0.5px]" style={{ zIndex: 400 }}>
             <span className="bg-white/95 border border-neutral-200 text-[10px] font-black uppercase px-4 py-2 rounded-xl shadow-md text-neutral-700 animate-pulse">
               Tap map to drop pin
             </span>
          </div>
        )}
      </div>
    </div>
  );
}
