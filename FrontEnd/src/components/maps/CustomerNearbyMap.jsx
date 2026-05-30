import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { fixLeafletIcons, Icons } from './MapConfig';

// Initialize default icons
fixLeafletIcons();

const CustomerNearbyMap = ({ 
  center = [51.505, -0.09], 
  zoom = 13, 
  restaurants = [], 
  customerLocation = null 
}) => {

  const defaultCenter = customerLocation 
    ? [customerLocation.latitude, customerLocation.longitude] 
    : center;

  return (
    <div className="w-full h-64 md:h-96 rounded-xl overflow-hidden shadow-md border border-neutral-200 dark:border-neutral-700">
      <MapContainer 
        center={defaultCenter} 
        zoom={zoom} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Customer Location */}
        {customerLocation && (
          <>
            <Marker 
              position={[customerLocation.latitude, customerLocation.longitude]} 
              icon={Icons.Customer}
            >
              <Popup>You are here</Popup>
            </Marker>
            <Circle 
              center={[customerLocation.latitude, customerLocation.longitude]} 
              radius={2000} // 2km radius
              pathOptions={{ fillColor: '#3b82f6', color: '#3b82f6', fillOpacity: 0.1 }}
            />
          </>
        )}

        {/* Nearby Restaurants */}
        {restaurants.map((restaurant) => (
          <Marker 
            key={restaurant.id} 
            position={[restaurant.latitude, restaurant.longitude]}
            icon={Icons.Restaurant}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-bold">{restaurant.name}</p>
                <p className="text-neutral-500">{restaurant.distance} km away</p>
                {restaurant.is_open ? (
                  <span className="text-green-600 text-xs font-semibold">Open Now</span>
                ) : (
                  <span className="text-red-600 text-xs font-semibold">Closed</span>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default CustomerNearbyMap;
