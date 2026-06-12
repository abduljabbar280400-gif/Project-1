import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FiArrowLeft, FiCheck, FiClock, FiUser, FiTruck, FiAlertTriangle } from 'react-icons/fi';
import SEO from '../../components/SEO';
import { notificationService } from '../../services/notificationService';

export default function OrderTracking() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  const fetchOrder = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const data = await api.customer.trackOrder(orderId);
      const fetchedOrder = data?.data || data;
      
      // Send notifications for order status transitions
      notificationService.checkCustomerOrders([fetchedOrder]);

      setOrder(fetchedOrder);

      if (fetchedOrder.status === 'rejected') {
        const viewed = JSON.parse(localStorage.getItem('viewed_rejected_orders') || '[]');
        if (!viewed.includes(fetchedOrder.id)) {
          viewed.push(fetchedOrder.id);
          localStorage.setItem('viewed_rejected_orders', JSON.stringify(viewed));
        }
      }

      setError('');
    } catch (err) {
      setError('Unable to fetch order status. Retrying...');
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder(true);
    const interval = setInterval(() => { fetchOrder(false); }, 10000);
    return () => clearInterval(interval);
  }, [orderId]);

  useEffect(() => {
    if (!order) return;
    const calculateTimeLeft = () => {
      const createdAt = new Date(order.created_at);
      const diffMs = new Date() - createdAt;
      const totalWindowMs = 15 * 60 * 1000;
      const remainingMs = totalWindowMs - diffMs;
      
      if (remainingMs <= 0 || !['accepted', 'preparing'].includes(order.status)) {
        setTimeLeft('');
        return;
      }
      
      const mins = Math.floor(remainingMs / 1000 / 60);
      const secs = Math.floor((remainingMs / 1000) % 60);
      setTimeLeft(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
    };
    
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [order]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      const res = await api.customer.cancelOrder(orderId);
      setOrder(res.order);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <LoadingSpinner message="Connecting to kitchen track..." />;

  if (error && !order) {
    return (
      <div className="py-12 p-6 rounded-2xl text-center shadow-sm max-w-md mx-auto" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border)' }}>
        <FiAlertTriangle className="text-rose-500 text-3xl mx-auto mb-3 animate-bounce" />
        <h3 className="text-sm font-bold" style={{ color: 'var(--text-head)' }}>Order not found</h3>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{error}</p>
        <button onClick={() => fetchOrder(true)} className="btn-primary mt-4 w-auto px-6 cursor-pointer">Retry</button>
      </div>
    );
  }

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const status = order.status;
  const isCancelled = status === 'cancelled' || status === 'rejected';

  const step1_placed = true;
  const step2_accepted = isCancelled ? false : ['accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered'].includes(status);
  const step3_preparing = isCancelled ? false : ['preparing', 'ready', 'out_for_delivery', 'delivered'].includes(status);
  const step4_ready = isCancelled ? false : ['ready', 'out_for_delivery', 'delivered'].includes(status);
  const step5_transit = isCancelled ? false : ['out_for_delivery', 'delivered'].includes(status);
  const step6_delivered = isCancelled ? false : status === 'delivered';

  return (
    <div className="space-y-6 pb-12 select-none">
      <SEO title="Track Your Live Delivery Status" description="Real-time GPS tracking and live status updates for your food delivery order on Num Num." />
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/customer/orders')}
          className="touch-target rounded-xl shadow-sm cursor-pointer"
          style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-body)' }}
          aria-label="Back to orders list"
        >
          <FiArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-lg font-extrabold leading-none" style={{ color: 'var(--text-head)' }}>Order Tracking</h2>
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Order ID: #{order.id}</span>
        </div>
      </div>

      <div className="card-solid p-5 space-y-4 shadow-sm" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border)' }}>
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Restaurant</span>
            <h3 className="text-base font-extrabold" style={{ color: 'var(--text-head)' }}>{order.restaurant_name}</h3>
          </div>
          <span className={`text-[10px] font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-lg text-white shadow-sm ${isCancelled ? 'bg-rose-600' :
              status === 'delivered' ? 'bg-emerald-600' :
                status === 'out_for_delivery' ? 'bg-indigo-600 animate-pulse' :
                  'bg-brand-500 animate-pulse'
            }`} style={!['delivered', 'cancelled', 'rejected', 'out_for_delivery'].includes(status) ? { backgroundColor: '#B4846C' } : {}}>
            {status.replace('_', ' ')}
          </span>
        </div>

        {timeLeft && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200 mt-2">
            <div className="text-xs text-amber-800 font-semibold">
              <span className="block font-bold">Customize your order!</span>
              <span className="block text-[10px] text-amber-600 font-medium">You can add extra dishes for the next {timeLeft} minutes.</span>
            </div>
            <button
              onClick={() => navigate(`/customer/restaurants/${order.restaurant_id}`)}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-black uppercase tracking-wider shadow-sm cursor-pointer transition-colors"
            >
              Add More
            </button>
          </div>
        )}

        {status === 'pending' && (
          <button onClick={handleCancelOrder} disabled={cancelling} className="btn-danger w-full py-2.5 font-bold cursor-pointer">
            {cancelling ? 'Cancelling...' : 'Cancel Order'}
          </button>
        )}

        {isCancelled && (
          <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-3 rounded-lg text-xs font-semibold">
            <span className="block font-bold">This order was {status}.</span>
            {order.rejection_reason && (
              <span className="block mt-1 font-medium text-rose-600">Reason: "{order.rejection_reason}"</span>
            )}
          </div>
        )}
      </div>

      {!isCancelled && (
        <div className="card-solid p-5 space-y-5 shadow-sm" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border)' }}>
          <h3 className="text-xs font-extrabold uppercase tracking-wider pb-2" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
            Delivery Timeline
          </h3>

          <div className="relative pl-8 space-y-7 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[2px]" style={{ '--tw-before-bg-color': 'var(--border)' }}>

            <div className="relative">
              <div className="absolute -left-8 w-7.5 h-7.5 rounded-full flex items-center justify-center border text-xs font-bold"
                style={step1_placed ? { backgroundColor: '#B4846C', borderColor: '#B4846C', color: '#fff' } : { backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                <FiCheck size={12} />
              </div>
              <div>
                <h4 className="text-xs font-extrabold" style={{ color: 'var(--text-head)' }}>Order Placed</h4>
                <p className="text-[10px] font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>We've received your order. {formatTime(order.created_at)}</p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-8 w-7.5 h-7.5 rounded-full flex items-center justify-center border text-xs font-bold"
                style={step2_accepted ? { backgroundColor: '#B4846C', borderColor: '#B4846C', color: '#fff' } : { backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                {step2_accepted ? <FiCheck size={12} /> : <FiClock size={12} />}
              </div>
              <div>
                <h4 className="text-xs font-extrabold" style={{ color: 'var(--text-head)' }}>Order Confirmed</h4>
                <p className="text-[10px] font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>{step2_accepted ? `Kitchen accepted the order. ${formatTime(order.accepted_at)}` : 'Waiting for kitchen approval.'}</p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-8 w-7.5 h-7.5 rounded-full flex items-center justify-center border text-xs font-bold"
                style={step3_preparing ? { backgroundColor: '#B4846C', borderColor: '#B4846C', color: '#fff' } : { backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                {step3_preparing ? <FiCheck size={12} /> : <FiClock size={12} />}
              </div>
              <div>
                <h4 className="text-xs font-extrabold" style={{ color: 'var(--text-head)' }}>Cooking & Preparing</h4>
                <p className="text-[10px] font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>{step3_preparing ? 'Your chef is preparing your fresh meal.' : 'Kitchen will start cooking soon.'}</p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-8 w-7.5 h-7.5 rounded-full flex items-center justify-center border text-xs font-bold"
                style={step4_ready ? { backgroundColor: '#B4846C', borderColor: '#B4846C', color: '#fff' } : { backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                {step4_ready ? <FiCheck size={12} /> : <FiClock size={12} />}
              </div>
              <div>
                <h4 className="text-xs font-extrabold" style={{ color: 'var(--text-head)' }}>Food Ready for Pick Up</h4>
                <p className="text-[10px] font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>{step4_ready ? `Packed and waiting at the counter. ${formatTime(order.prepared_at)}` : 'Preparing meal box.'}</p>
              </div>
            </div>

            <div className="relative">
              <div className={`absolute -left-8 w-7.5 h-7.5 rounded-full flex items-center justify-center border text-xs font-bold ${step5_transit ? 'animate-pulse' : ''}`}
                style={step5_transit ? { backgroundColor: '#6366f1', borderColor: '#6366f1', color: '#fff' } : { backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                {step5_transit ? <FiTruck size={12} /> : <FiClock size={12} />}
              </div>
              <div>
                <h4 className="text-xs font-extrabold" style={{ color: 'var(--text-head)' }}>Dispatched & In Transit</h4>
                {step5_transit ? (
                  <div className="mt-1 space-y-1">
                    <span className="block text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>Out for delivery! {formatTime(order.picked_up_at)}</span>
                    {order.driver_name && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-extrabold p-1.5 rounded-lg max-w-xs"
                          style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', color: '#B4846C' }}>
                          <FiUser size={10} />
                          <span>Driver: {order.driver_name} ({order.driver_phone})</span>
                        </div>
                        {order.delivery_pin && (
                          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex flex-col items-center max-w-xs">
                            <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider mb-1">Delivery PIN</span>
                            <span className="text-2xl font-black text-amber-600 tracking-[0.2em]">{order.delivery_pin}</span>
                            <span className="text-[9px] text-amber-700 font-semibold mt-1 text-center">Share this PIN with your driver to receive your food.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[10px] font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>Waiting for delivery partner pickup.</p>
                )}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-8 w-7.5 h-7.5 rounded-full flex items-center justify-center border text-xs font-bold"
                style={step6_delivered ? { backgroundColor: '#10b981', borderColor: '#10b981', color: '#fff' } : { backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                {step6_delivered ? <FiCheck size={12} /> : <FiClock size={12} />}
              </div>
              <div>
                <h4 className="text-xs font-extrabold" style={{ color: 'var(--text-head)' }}>Delivered</h4>
                <p className="text-[10px] font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {step6_delivered ? `Enjoy your fresh food! Delivered at ${formatTime(order.delivered_at)}` : 'Waiting for delivery arrival.'}
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      <div className="card-solid p-5 space-y-4 shadow-sm" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border)' }}>
        <h3 className="text-xs font-extrabold uppercase tracking-wider pb-2" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Original Items</h3>
        <div className="space-y-3">
          {(order.order_items?.filter(item => !item.is_extra) || []).map(item => (
            <div key={item.id} className="flex justify-between items-center text-xs font-medium" style={{ color: 'var(--text-body)' }}>
              <span>{item.name} <span className="font-extrabold" style={{ color: 'var(--text-muted)' }}>x{item.quantity}</span></span>
              <span className="font-bold">₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        {order.order_items?.some(item => item.is_extra) && (
          <div className="pt-4 space-y-3" style={{ borderTop: '1px dashed var(--border)' }}>
            <h3 className="text-xs font-extrabold uppercase tracking-wider pb-1" style={{ color: 'var(--text-muted)' }}>Extra Items Added</h3>
            <div className="space-y-3">
              {order.order_items.filter(item => item.is_extra).map(item => {
                let statusBadge = null;
                if (item.extra_status === 'pending') {
                  statusBadge = <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">⏳ Pending Chef Approval</span>;
                } else if (item.extra_status === 'accepted') {
                  statusBadge = <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">✅ Accepted</span>;
                } else if (item.extra_status === 'rejected') {
                  statusBadge = <span className="text-[9px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">❌ Declined</span>;
                }
                return (
                  <div key={item.id} className="flex justify-between items-center text-xs font-medium" style={{ color: 'var(--text-body)' }}>
                    <div className="flex flex-col gap-0.5">
                      <span>{item.name} <span className="font-extrabold" style={{ color: 'var(--text-muted)' }}>x{item.quantity}</span></span>
                      <div>{statusBadge}</div>
                    </div>
                    <span className="font-bold">₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {order.extra_rejection_reason && (
          <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-3 rounded-lg text-xs font-semibold mt-3">
            <span className="block font-bold">Extra items request was declined.</span>
            <span className="block mt-0.5 font-medium text-rose-600">Reason: "{order.extra_rejection_reason}"</span>
          </div>
        )}

        <div className="pt-3 space-y-1.5 text-xs font-semibold" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          <div className="flex justify-between">
            <span>Items Subtotal</span>
            <span>₹{(Number(order.subtotal) - (order.order_items?.filter(item => item.is_extra && item.extra_status === 'accepted').reduce((acc, curr) => acc + (curr.price * curr.quantity), 0) || 0)).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery Fee</span>
            <span>₹{Number(order.delivery_fee).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Platform Service Fee</span>
            <span>₹{Number(order.service_fee).toFixed(2)}</span>
          </div>
          {order.order_items?.some(item => item.is_extra && item.extra_status === 'accepted') && (
            <div className="flex justify-between font-bold text-emerald-600">
              <span>Accepted Extras</span>
              <span>+₹{(order.order_items.filter(item => item.is_extra && item.extra_status === 'accepted').reduce((acc, curr) => acc + (curr.price * curr.quantity), 0)).toFixed(2)}</span>
            </div>
          )}
          {order.order_items?.some(item => item.is_extra && item.extra_status === 'pending') && (
            <div className="flex justify-between font-bold text-amber-600">
              <span>Pending Extras (Awaiting Acceptance)</span>
              <span>+₹{(order.order_items.filter(item => item.is_extra && item.extra_status === 'pending').reduce((acc, curr) => acc + (curr.price * curr.quantity), 0)).toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="pt-3 flex justify-between items-center text-xs font-extrabold" style={{ borderTop: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--text-muted)' }}>Total Amount</span>
          <span className="text-sm font-black" style={{ color: 'var(--text-head)' }}>₹{Number(order.total_amount).toFixed(2)}</span>
        </div>
        <div className="text-[10px] font-semibold leading-relaxed pt-3" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
          📍 <span className="font-bold">Delivery Address:</span> {order.delivery_address}
          {order.special_instructions && (
            <span className="block mt-1 font-bold">📝 Instructions: "{order.special_instructions}"</span>
          )}
        </div>
      </div>

    </div>
  );
}
