import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import NetworkError from '../../components/NetworkError';
import { FiCoffee, FiAlertCircle, FiVolume2, FiCheck, FiPlay, FiTrash2, FiClock } from 'react-icons/fi';
import SEO from '../../components/SEO';
import { notificationService } from '../../services/notificationService';

export default function ChefDashboard() {
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const knownOrderIds = useRef(new Set());
  const knownExtraOrderIds = useRef(new Set());

  const playNewOrderChime = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
      gain1.gain.setValueAtTime(0.2, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.18);
      gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.2);
      osc2.start(ctx.currentTime + 0.18);
      osc2.stop(ctx.currentTime + 0.45);
    } catch (e) {
      console.warn('Audio synthesis not allowed or supported yet', e);
    }
  };

  const fetchProfile = async () => {
    try {
      const data = await api.chef.getProfile();
      setRestaurant(data.restaurant);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const activeOrders = await api.chef.getOrders();
      const ordersData = activeOrders?.data || activeOrders;
      setOrders(ordersData);
      
      let hasNewPending = false;
      ordersData.forEach(o => {
        // Notification for new pending orders
        if (o.status === 'pending' && !knownOrderIds.current.has(o.id)) {
          hasNewPending = true;
          notificationService.send(`chef-order-${o.id}`, `New Order Received! 🍳`, {
            body: `Order #${o.id} from ${o.customer_name}`
          });
        }

        // Notification for extra items added
        const hasPendingExtras = o.order_items?.some(item => item.is_extra && item.extra_status === 'pending');
        if (hasPendingExtras && !knownExtraOrderIds.current.has(o.id)) {
          notificationService.send(`chef-extra-${o.id}`, `Extra Items Requested! ⚠️`, {
            body: `Customer added extras to Order #${o.id}`
          });
        }
      });

      const updatedSet = new Set();
      const updatedExtraSet = new Set();
      ordersData.forEach(o => {
        updatedSet.add(o.id);
        const hasPendingExtras = o.order_items?.some(item => item.is_extra && item.extra_status === 'pending');
        if (hasPendingExtras) {
          updatedExtraSet.add(o.id);
        }
      });
      
      knownOrderIds.current = updatedSet;
      knownExtraOrderIds.current = updatedExtraSet;

      if (hasNewPending && !showSpinner) playNewOrderChime();
      setError(null);
    } catch (err) {
      setError(err.message || 'Unable to load orders.');
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await fetchProfile();
      await fetchOrders(false);
      setLoading(false);
    };
    initialize();
    const interval = setInterval(() => { fetchOrders(false); }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleOpen = async () => {
    setProfileLoading(true);
    try {
      const res = await api.chef.toggleOpen();
      setRestaurant(prev => ({ ...prev, is_open: res.is_open }));
    } catch (err) {
      alert('Failed to toggle open status.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleAction = async (orderId, action) => {
    let reason = '';
    if (action === 'reject') {
      reason = window.prompt('Please enter a rejection reason for the customer:');
      if (reason === null) return;
      if (!reason.trim()) { alert('A rejection reason is required.'); return; }
    }
    try {
      await api.chef.updateOrderStatus(orderId, action, reason);
      fetchOrders(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order.');
    }
  };

  const handleExtraAction = async (orderId, action) => {
    let reason = '';
    if (action === 'reject') {
      reason = window.prompt('Please enter a rejection reason for the extra items:');
      if (reason === null) return;
      if (!reason.trim()) { alert('A rejection reason is required.'); return; }
    }
    try {
      await api.chef.updateExtraItemsStatus(orderId, action, reason);
      fetchOrders(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update extra items.');
    }
  };

  if (loading) return <LoadingSpinner message="Connecting to kitchen dashboard..." />;

  if (error && orders.length === 0) {
    return (
      <div className="py-12">
        <NetworkError message={error} onRetry={() => fetchOrders(true)} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 select-none">
      <SEO title="Kitchen Operations Dashboard" description="Review incoming orders, process kitchen cooking pipelines, toggle online operations, and prepare fresh meals." />

      {/* Overview Stats & Toggle */}
      <div className="card-solid p-5 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-base font-extrabold leading-none" style={{ color: 'var(--text-head)' }}>
              {restaurant?.name || 'Chef Kitchen'}
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Operating Manager
            </span>
          </div>

          <button
            onClick={playNewOrderChime}
            className="flex items-center gap-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-body)' }}
            title="Test Bell Notification Audio"
          >
            <FiVolume2 size={14} />
            <span>Test Chime</span>
          </button>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl" style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <span className="relative flex h-3.5 w-3.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${restaurant?.is_open ? 'bg-emerald-400' : 'bg-slate-400'
                }`}></span>
              <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${restaurant?.is_open ? 'bg-emerald-500' : 'bg-slate-500'
                }`}></span>
            </span>
            <div>
              <span className="text-xs font-extrabold block leading-none" style={{ color: 'var(--text-head)' }}>
                Kitchen is {restaurant?.is_open ? 'OPEN' : 'CLOSED'}
              </span>
              <span className="text-[9px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>
                {restaurant?.is_open ? 'Accepting customer orders' : 'Not taking orders'}
              </span>
            </div>
          </div>

          <button
            onClick={handleToggleOpen}
            disabled={profileLoading}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider shadow-sm transition-colors cursor-pointer select-none ${restaurant?.is_open
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
          >
            {restaurant?.is_open ? 'Go Offline' : 'Go Online'}
          </button>
        </div>
      </div>

      {/* Orders Queue Section */}
      <div className="space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Kitchen Order Queue ({orders.length})
        </span>

        {orders.length === 0 ? (
          <div className="card-solid p-8 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              <FiCoffee size={24} />
            </div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-head)' }}>No active orders right now</h3>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Keep the browser open. Incoming orders will play a sound alert.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const dateObj = new Date(order.created_at);
              const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={order.id}
                  className="card-solid p-4 space-y-3.5 shadow-sm relative"
                  style={{ borderLeft: '4px solid #B4846C' }}
                >
                  {/* Top Order Meta */}
                  <div className="flex justify-between items-start pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black" style={{ color: 'var(--text-head)' }}>Order #{order.id}</span>
                        <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded text-white ${order.status === 'pending' ? 'bg-amber-500 animate-pulse' :
                            order.status === 'accepted' ? 'bg-indigo-500' :
                              order.status === 'preparing' ? '' :
                                'bg-emerald-600'
                          }`} style={order.status === 'preparing' ? { backgroundColor: '#B4846C' } : {}}>
                          {order.status}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold block mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        👤 Customer: {order.customer_name}
                      </span>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded-lg"
                      style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)' }}>
                      ⏰ {formattedTime}
                    </span>
                  </div>

                  {/* Food Items Ordered */}
                  <div className="space-y-1.5 p-2.5 rounded-xl" style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                    <span className="block text-[9px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>DISH LIST</span>
                    {order.order_items?.filter(item => item.extra_status !== 'pending' && item.extra_status !== 'rejected').map(item => (
                      <div key={item.id} className="flex items-center gap-2.5 text-xs font-semibold" style={{ color: 'var(--text-body)' }}>
                        {/* Dish Image Thumbnail */}
                        <div
                          className="flex-shrink-0 w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center"
                          style={{ backgroundColor: 'var(--border)', border: '1px solid var(--border)' }}
                        >
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                            />
                          ) : null}
                          <span style={{ display: item.image ? 'none' : 'flex', fontSize: '14px' }} className="w-full h-full items-center justify-center">🍽️</span>
                        </div>
                        <span className="flex-1 truncate">
                          {item.name} {item.is_extra && <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full ml-1">Extra</span>}
                        </span>
                        <span className="font-black text-sm px-2 py-0.5 rounded-md"
                          style={{ backgroundColor: 'var(--border)', color: 'var(--text-head)' }}>x{item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {/* Customer Added Extra Items Panel */}
                  {order.order_items?.some(item => item.is_extra && item.extra_status === 'pending') && (
                    <div className="space-y-2 p-3 rounded-xl border border-dashed border-amber-300 bg-amber-50/50 mt-2">
                      <span className="block text-[9px] font-extrabold uppercase tracking-wider text-amber-800">⚠️ Customer Added Extra Items!</span>
                      <div className="space-y-1.5">
                        {order.order_items.filter(item => item.is_extra && item.extra_status === 'pending').map(item => (
                          <div key={item.id} className="flex items-center gap-2.5 text-xs font-semibold text-amber-950">
                            <span className="flex-1 truncate">{item.name}</span>
                            <span className="font-black text-xs px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">x{item.quantity}</span>
                            <span className="font-bold text-amber-700">₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-200">
                        <button
                          onClick={() => handleExtraAction(order.id, 'accept')}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer text-center"
                        >
                          Accept Extras
                        </button>
                        <button
                          onClick={() => handleExtraAction(order.id, 'reject')}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase bg-rose-600 hover:bg-rose-700 text-white shadow-sm cursor-pointer text-center"
                        >
                          Decline Extras
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Special Instructions */}
                  {order.special_instructions && (
                    <div className="text-[10px] text-amber-800 font-bold leading-relaxed bg-amber-50 p-2 rounded-lg border border-amber-100 mt-2">
                      📝 Note: "{order.special_instructions}"
                    </div>
                  )}

                  {/* Operational Action Buttons */}
                  <div className="pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                    {order.status === 'pending' && (
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => handleAction(order.id, 'accept')} className="btn-success py-2.5 text-xs font-black uppercase tracking-wider cursor-pointer">Accept Order</button>
                        <button onClick={() => handleAction(order.id, 'reject')} className="btn-danger py-2.5 text-xs font-black uppercase tracking-wider cursor-pointer">Reject</button>
                      </div>
                    )}
                    {order.status === 'accepted' && (
                      <button onClick={() => handleAction(order.id, 'prepare')} className="btn-primary py-2.5 text-xs font-black uppercase tracking-wider cursor-pointer">Start Cooking / Preparing</button>
                    )}
                    {order.status === 'preparing' && (
                      <button onClick={() => handleAction(order.id, 'ready')} className="btn-success py-2.5 text-xs font-black uppercase tracking-wider cursor-pointer">Mark Food Ready for Driver</button>
                    )}
                    {order.status === 'ready' && (
                      <div className="p-2.5 rounded-xl text-center text-xs font-semibold" style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                        Awaiting Driver Pickup...
                      </div>
                    )}
                    {order.status === 'out_for_delivery' && (
                      <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 p-2.5 rounded-xl text-center text-xs font-bold flex flex-col items-center justify-center gap-1">
                        <div className="flex items-center gap-1.5"><FiClock className="animate-spin" /> In Transit</div>
                        {order.driver_name && (
                          <span className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-wider">
                            with {order.driver_name} ({order.driver_phone})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
