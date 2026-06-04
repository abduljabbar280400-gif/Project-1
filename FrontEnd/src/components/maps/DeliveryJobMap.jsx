import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import { fixLeafletIcons, Icons } from './MapConfig';
import { fetchRoute } from '../../services/routingService';
import { FiMaximize, FiMinimize, FiCrosshair } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';

fixLeafletIcons();

// Helper to auto-fit bounds ONCE
const AutoFitBounds = ({ bounds }) => {
  const map = useMap();
  const hasFitted = useRef(false);

  useEffect(() => {
    // We want to fit bounds only when bounds first become available for a route
    // To allow "free panning", we set a ref once we've successfully fitted it
    if (bounds && bounds.length > 0 && !hasFitted.current) {
      map.fitBounds(bounds, { padding: [50, 50] });
      hasFitted.current = true;
    }
  }, [bounds, map]);

  // Reset the fitted state if the job fundamentally changes
  useEffect(() => {
    hasFitted.current = false;
  }, [JSON.stringify(bounds[0]), JSON.stringify(bounds[1])]);

  return null;
};

// Component to fix layout sizes when fullscreen toggles
const MapLayoutFix = ({ isFullscreen }) => {
  const map = useMap();
  useEffect(() => {
    const timeout = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timeout);
  }, [isFullscreen, map]);
  return null;
};

// Component to handle tracking the driver
const MapTrackingControl = ({ driverLocation, isTracking, setIsTracking }) => {
  const map = useMapEvents({
    dragstart() {
      if (isTracking) setIsTracking(false);
    }
  });

  useEffect(() => {
    if (isTracking && driverLocation?.latitude) {
      map.flyTo([driverLocation.latitude, driverLocation.longitude], 18, { animate: true });
    }
  }, [driverLocation, isTracking, map]);

  return null;
};

const DeliveryJobMap = ({ 
  pickupLocation, // { lat, lng, name }
  dropoffLocation, // { lat, lng, name }
  driverLocation, // { lat, lng }
  routeMode = 'preview', // 'preview', 'to_pickup', 'to_dropoff'
  autoOpenFullscreen = false,
  onRouteCalculated // callback(distance, duration)
}) => {
  const [route, setRoute] = useState(null);
  const [bounds, setBounds] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(autoOpenFullscreen);
  const [isTracking, setIsTracking] = useState(autoOpenFullscreen);
  const [routeInfo, setRouteInfo] = useState({ distance: null, duration: null });
  const { isDark } = useTheme();

  const handleLocateMe = () => {
    setIsTracking(true);
  };

  useEffect(() => {
    const getRoute = async () => {
      // Determine what coordinates to route between based on mode
      let startPoint = null;
      let endPoint = null;

      if (routeMode === 'preview') {
        startPoint = pickupLocation;
        endPoint = dropoffLocation;
      } else if (routeMode === 'to_pickup' && driverLocation?.latitude) {
        startPoint = { lat: driverLocation.latitude, lng: driverLocation.longitude };
        endPoint = pickupLocation;
      } else if (routeMode === 'to_dropoff' && driverLocation?.latitude) {
        startPoint = { lat: driverLocation.latitude, lng: driverLocation.longitude };
        endPoint = dropoffLocation;
      } else {
        // Fallback if missing driver location
        startPoint = pickupLocation;
        endPoint = dropoffLocation;
      }

      if (startPoint && endPoint) {
        try {
          const routeData = await fetchRoute(
            [startPoint.lng, startPoint.lat],
            [endPoint.lng, endPoint.lat]
          );
          setRoute(routeData.polyline);
          setRouteInfo({ distance: routeData.distance, duration: routeData.duration });
          
          if (onRouteCalculated) {
            onRouteCalculated({
              distance: routeData.distance,
              duration: routeData.duration
            });
          }

          // Calculate bounds to include all relevant points for this mode
          const allPoints = [...routeData.polyline];
          if (routeMode === 'preview') {
            allPoints.push([pickupLocation.lat, pickupLocation.lng]);
            allPoints.push([dropoffLocation.lat, dropoffLocation.lng]);
          } else if (routeMode === 'to_pickup' && driverLocation?.latitude) {
            allPoints.push([driverLocation.latitude, driverLocation.longitude]);
            allPoints.push([pickupLocation.lat, pickupLocation.lng]);
          } else if (routeMode === 'to_dropoff' && driverLocation?.latitude) {
            allPoints.push([driverLocation.latitude, driverLocation.longitude]);
            allPoints.push([dropoffLocation.lat, dropoffLocation.lng]);
          } else {
            // fallback bounds
            allPoints.push([pickupLocation.lat, pickupLocation.lng]);
            allPoints.push([dropoffLocation.lat, dropoffLocation.lng]);
          }
          setBounds(allPoints);

        } catch (error) {
          console.error("Failed to load route", error);
          // Fallback bounds
          setBounds([
            [startPoint.lat, startPoint.lng],
            [endPoint.lat, endPoint.lng]
          ]);
        }
      }
    };

    getRoute();
  }, [pickupLocation, dropoffLocation, driverLocation, routeMode]);

  if (!pickupLocation || !dropoffLocation) {
    return <div className="p-4 text-center bg-neutral-100 rounded-xl">Loading map data...</div>;
  }

  // Default center based on mode
  let defaultCenter = [pickupLocation.lat, pickupLocation.lng];
  if (routeMode === 'to_pickup' && driverLocation?.latitude) defaultCenter = [driverLocation.latitude, driverLocation.longitude];
  if (routeMode === 'to_dropoff' && driverLocation?.latitude) defaultCenter = [driverLocation.latitude, driverLocation.longitude];

  return (
    <div 
      className={isFullscreen ? "fixed left-1/2 -translate-x-1/2 w-full max-w-md top-[64px] bottom-[72px] z-[60] flex flex-col shadow-2xl" : "w-full h-64 md:h-80 rounded-xl overflow-hidden shadow-inner border relative z-0"}
      style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border)' }}
    >
      
      {/* Fullscreen Toggle Header if in fullscreen */}
      {isFullscreen && (
        <div className="px-4 py-3 shadow-sm flex justify-between items-center z-10 relative" style={{ backgroundColor: 'var(--bg-panel)', borderBottom: '1px solid var(--border)' }}>
          <span className="font-extrabold text-sm uppercase tracking-wider" style={{ color: 'var(--text-head)' }}>
            {routeMode === 'preview' ? 'Job Preview' : routeMode === 'to_pickup' ? 'Navigating to Kitchen' : 'Navigating to Customer'}
          </span>
          <button 
            onClick={() => setIsFullscreen(false)}
            className="p-2 rounded-lg cursor-pointer transition-colors hover:brightness-95"
            style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)' }}
          >
            <FiMinimize size={20} />
          </button>
        </div>
      )}

      {/* Embedded Fullscreen button if NOT fullscreen */}
      {!isFullscreen && (
        <button 
          onClick={() => setIsFullscreen(true)}
          className="absolute top-2 right-2 z-[1000] backdrop-blur-sm p-2 rounded-lg shadow-md cursor-pointer transition-colors hover:brightness-95"
          style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          title="View Fullscreen Map"
        >
          <FiMaximize size={18} />
        </button>
      )}

      {/* Locate Me button */}
      <button 
        onClick={handleLocateMe}
        disabled={!driverLocation?.latitude}
        className={`absolute z-[1000] backdrop-blur-sm p-2 rounded-lg shadow-md cursor-pointer transition-colors hover:brightness-95 ${isFullscreen ? 'top-16 right-4' : 'top-12 right-2'}`}
        style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border)' }}
        title="Center on my location"
      >
        <FiCrosshair size={18} className={isTracking ? "text-emerald-600" : "text-neutral-400"} />
      </button>

      <div className={isFullscreen ? "flex-1 w-full relative" : "w-full h-full relative"}>
        <MapContainer 
          center={defaultCenter} 
          zoom={14} 
          scrollWheelZoom={true} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className={isDark ? 'map-tiles-dark' : ''}
          />

          <MapLayoutFix isFullscreen={isFullscreen} />
          {isFullscreen && <MapTrackingControl driverLocation={driverLocation} isTracking={isTracking} setIsTracking={setIsTracking} />}
          {!isFullscreen && bounds.length > 0 && <AutoFitBounds bounds={bounds} />}

          {/* Points to render based on mode */}
          {(routeMode === 'preview' || routeMode === 'to_pickup') && (
            <Marker position={[pickupLocation.lat, pickupLocation.lng]} icon={Icons.Restaurant}>
              <Popup>Pickup: {pickupLocation.name || 'Kitchen'}</Popup>
            </Marker>
          )}

          {(routeMode === 'preview' || routeMode === 'to_dropoff') && (
            <Marker position={[dropoffLocation.lat, dropoffLocation.lng]} icon={Icons.Customer}>
              <Popup>Drop-off: {dropoffLocation.name || 'Customer'}</Popup>
            </Marker>
          )}

          {/* Driver Current Location */}
          {driverLocation?.latitude && (
            <Marker position={[driverLocation.latitude, driverLocation.longitude]} icon={Icons.Driver}>
              <Popup>Your Location</Popup>
            </Marker>
          )}

          {/* Route Line */}
          {route && (
            <Polyline 
              positions={route} 
              color="#3b82f6" // Blue-500
              weight={6} 
              opacity={0.9} 
            />
          )}
        </MapContainer>

        {/* Navigation Overlay (Distance/ETA) */}
        {isFullscreen && routeInfo.distance && (
          <div className="absolute bottom-4 left-4 right-4 z-[1000] backdrop-blur-md rounded-2xl shadow-xl p-4 flex items-center justify-between"
               style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border)' }}>
            <div>
              <div className="text-2xl font-black text-emerald-600 leading-none">
                {Math.ceil(routeInfo.duration / 60)} <span className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>min</span>
              </div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>
                {(routeInfo.distance / 1000).toFixed(1)} km remaining
              </div>
            </div>
            <button 
              onClick={() => setIsFullscreen(false)}
              className="px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-sm transition-colors cursor-pointer"
              style={{ backgroundColor: '#e11d48', color: '#fff' }}
            >
              Exit Nav
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryJobMap;
