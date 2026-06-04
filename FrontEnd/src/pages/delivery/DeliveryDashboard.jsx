import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import NetworkError from '../../components/NetworkError';
import { FiTruck, FiMapPin, FiPlay, FiCheck, FiCoffee, FiActivity } from 'react-icons/fi';
import { useGeolocation } from '../../hooks/useGeolocation';
import DeliveryJobMap from '../../components/maps/DeliveryJobMap';
import SEO from '../../components/SEO';

export default function DeliveryDashboard() {
  const [profile, setProfile] = useState(null);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [checklist, setChecklist] = useState({});
  const location = useLocation();
  const isActiveTab = location.pathname.includes('/active');
  const isJobsTab = location.pathname.includes('/jobs');

  // Driver location
  const { location: driverLocation } = useGeolocation({ enableHighAccuracy: true }, true);

  const handleCheck = (orderId, type) => {
    setChecklist(prev => ({ ...prev, [orderId]: { ...prev[orderId], [type]: !prev[orderId]?.[type] } }));
  };

  const fetchProfile = async () => {
    try { const data = await api.delivery.getProfile(); setProfile(data.profile); }
    catch (err) { console.error(err); }
  };

  const fetchJobsAndDeliveries = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const jobs = await api.delivery.getJobs();
      setAvailableJobs(jobs?.data || jobs);
      const active = await api.delivery.getOrders();
      setActiveOrders(active?.data || active);
      setError(null);
    } catch (err) {
      setError(err.message || 'Unable to load delivery jobs.');
    } finally { if (showSpinner) setLoading(false); }
  };

  useEffect(() => {
    const initialize = async () => { setLoading(true); await fetchProfile(); await fetchJobsAndDeliveries(false); setLoading(false); };
    initialize();
    const interval = setInterval(() => { fetchJobsAndDeliveries(false); }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleOnline = async () => {
    setProfileLoading(true);
    try { const res = await api.delivery.toggleAvailability(); setProfile(prev => ({ ...prev, is_available: res.is_available })); }
    catch (err) { alert('Failed to toggle status.'); }
    finally { setProfileLoading(false); }
  };

  const handleAcceptJob = async (orderId) => {
    try { await api.delivery.acceptJob(orderId); fetchJobsAndDeliveries(false); }
    catch (err) { alert(err.response?.data?.message || 'Failed to accept job.'); }
  };

  const handlePickup = async (orderId) => {
    if (!checklist[orderId]?.packed || !checklist[orderId]?.correct) { alert('Please complete the pickup checklist first.'); return; }
    try { await api.delivery.pickup(orderId); fetchJobsAndDeliveries(false); }
    catch (err) { alert(err.response?.data?.message || 'Failed to confirm pickup.'); }
  };

  const handleDeliver = async (orderId) => {
    const pin = window.prompt('Ask the customer for their 4-digit Delivery PIN to confirm they received the food:');
    if (!pin) return;
    if (pin.length !== 4) { alert('PIN must be exactly 4 digits.'); return; }
    try { await api.delivery.deliver(orderId, pin); fetchJobsAndDeliveries(false); fetchProfile(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to complete delivery.'); }
  };

  if (loading) return <LoadingSpinner message="Connecting to delivery network..." />;

  if (error && availableJobs.length === 0 && activeOrders.length === 0) {
    return (<div className="py-12"><NetworkError message={error} onRetry={() => fetchJobsAndDeliveries(true)} /></div>);
  }

  return (
    <div className="space-y-6 pb-8 select-none">
      <SEO title="Driver Jobs & Active Deliveries" description="Find open delivery jobs in your area, pick up fresh orders from chefs, and navigate to client dropoffs." />

      {/* Availability Status Box */}
      <div className="card-solid p-5 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-base font-extrabold leading-none" style={{ color: 'var(--text-head)' }}>Delivery Partner</h2>
            <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Vehicle Type: {profile?.vehicle_type || 'Bicycle'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl" style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <span className="relative flex h-3.5 w-3.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${profile?.is_available ? 'bg-emerald-400' : 'bg-slate-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${profile?.is_available ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
            </span>
            <div>
              <span className="text-xs font-extrabold block leading-none" style={{ color: 'var(--text-head)' }}>
                You are {profile?.is_available ? 'ONLINE' : 'OFFLINE'}
              </span>
              <span className="text-[9px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>
                {profile?.is_available ? 'Active & matching jobs' : 'Offline'}
              </span>
            </div>
          </div>
          <button
            onClick={handleToggleOnline} disabled={profileLoading}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider shadow-sm transition-colors cursor-pointer select-none ${profile?.is_available ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}>
            {profile?.is_available ? 'Go Offline' : 'Go Online'}
          </button>
        </div>
      </div>

      {/* Active Deliveries */}
      {isActiveTab && activeOrders.length > 0 && (
        <div className="space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
            Active Deliveries ({activeOrders.length})
          </span>
          <div className="space-y-4">
            {activeOrders.map(order => (
              <div key={order.id} className="card-solid p-4 space-y-3.5 shadow-md" style={{ borderLeft: '4px solid #6366f1' }}>
                <div className="flex justify-between items-start pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <h3 className="text-sm font-black" style={{ color: 'var(--text-head)' }}>Job #{order.id}</h3>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider block mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Customer: {order.customer_name} ({order.customer_phone})
                    </span>
                  </div>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-lg">{order.status}</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex gap-2">
                    <span className="font-extrabold uppercase text-[9px] w-14" style={{ color: 'var(--text-muted)' }}>PICKUP:</span>
                    <div className="flex-1 font-semibold">
                      <span className="block font-black" style={{ color: 'var(--text-head)' }}>{order.restaurant_name}</span>
                      <span className="block text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>{order.restaurant_address}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                    <span className="font-extrabold uppercase text-[9px] w-14" style={{ color: 'var(--text-muted)' }}>DROPOFF:</span>
                    <div className="flex-1 font-semibold">
                      <span className="block text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>{order.delivery_address}</span>
                      {order.special_instructions && (
                        <span className="block text-[9px] text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded-lg mt-1">
                          📝 Instructions: "{order.special_instructions}"
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Route Map for Active Job */}
                <div className="mt-3">
                  <DeliveryJobMap
                    pickupLocation={{
                      lat: order.pickup_latitude || 51.505,
                      lng: order.pickup_longitude || -0.09,
                      name: order.restaurant_name
                    }}
                    dropoffLocation={{
                      lat: order.dropoff_latitude || 51.51,
                      lng: order.dropoff_longitude || -0.1,
                      name: 'Customer'
                    }}
                    driverLocation={driverLocation?.latitude ? driverLocation : null}
                    routeMode={order.status === 'out_for_delivery' ? 'to_dropoff' : 'to_pickup'}
                    autoOpenFullscreen={true}
                  />
                </div>

                <div className="pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                  {order.status === 'ready' && (
                    <div className="space-y-3">
                      <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 space-y-2">
                        <span className="block text-[9px] font-extrabold uppercase text-amber-700 tracking-wider">Pickup Checklist</span>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={checklist[order.id]?.packed || false} onChange={() => handleCheck(order.id, 'packed')} className="w-4 h-4 rounded border-slate-300" />
                          <span className="text-[10px] font-bold text-amber-900">Food is perfectly packed</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={checklist[order.id]?.correct || false} onChange={() => handleCheck(order.id, 'correct')} className="w-4 h-4 rounded border-slate-300" />
                          <span className="text-[10px] font-bold text-amber-900">Order matches customer request</span>
                        </label>
                      </div>
                      <button onClick={() => handlePickup(order.id)}
                        disabled={!checklist[order.id]?.packed || !checklist[order.id]?.correct}
                        className={`btn-primary w-full py-2.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer ${(!checklist[order.id]?.packed || !checklist[order.id]?.correct) ? 'opacity-50 cursor-not-allowed' : ''
                          }`}><FiPlay /> Confirm Food Pickup</button>
                    </div>
                  )}
                  {order.status === 'out_for_delivery' && (
                    <button onClick={() => handleDeliver(order.id)}
                      className="btn-success w-full py-2.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer">
                      <FiCheck /> Confirm Delivery Complete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isActiveTab && activeOrders.length === 0 && (
        <div className="card-solid p-8 text-center mt-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            <FiActivity size={24} />
          </div>
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-head)' }}>No active deliveries</h3>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Accept a job from the Jobs tab to start earning.</p>
        </div>
      )}

      {/* Available Jobs */}
      {isJobsTab && (
        <div className="space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
          Available Pickup Jobs ({availableJobs.length})
        </span>

        {!profile?.is_available ? (
          <div className="card-solid p-6 text-center text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
            Go online to search and accept jobs.
          </div>
        ) : availableJobs.length === 0 ? (
          <div className="card-solid p-8 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              <FiTruck size={24} />
            </div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-head)' }}>No available jobs near you</h3>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Waiting for kitchens to mark food ready. Keep this screen active.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {availableJobs.map(order => (
              <div key={order.id} className="card-solid p-4 space-y-3 shadow-sm transition-colors">
                <div className="flex justify-between items-center pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <span className="text-xs font-black block" style={{ color: 'var(--text-head)' }}>Job #{order.id}</span>
                    <span className="text-[10px] font-bold block mt-0.5" style={{ color: 'var(--text-muted)' }}>📍 Pickup: {order.restaurant_name}</span>
                  </div>
                  <span className="text-xs font-black px-2.5 py-1 rounded-lg" style={{ color: '#7D5A50', backgroundColor: '#FCDEC0' }}>
                    Payout: ₹{Number(order.delivery_fee).toFixed(2)}
                  </span>
                </div>
                <div className="text-[10px] font-semibold space-y-1" style={{ color: 'var(--text-body)' }}>
                  <span className="block"><span className="font-extrabold" style={{ color: 'var(--text-muted)' }}>From:</span> {order.restaurant_address}</span>
                  <span className="block"><span className="font-extrabold" style={{ color: 'var(--text-muted)' }}>To:</span> {order.delivery_address}</span>
                </div>

                {/* Route Map Preview */}
                <div className="mt-2">
                  <DeliveryJobMap
                    pickupLocation={{
                      lat: order.pickup_latitude || 51.505,
                      lng: order.pickup_longitude || -0.09,
                      name: order.restaurant_name
                    }}
                    dropoffLocation={{
                      lat: order.dropoff_latitude || 51.51,
                      lng: order.dropoff_longitude || -0.1,
                      name: 'Customer'
                    }}
                    driverLocation={driverLocation?.latitude ? driverLocation : null}
                    routeMode="preview"
                  />
                </div>

                <button onClick={() => handleAcceptJob(order.id)} className="btn-primary w-full py-2.5 text-xs font-black uppercase tracking-wider cursor-pointer mt-2">
                  Accept Job & Navigate to Pickup
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

    </div>
  );
}
