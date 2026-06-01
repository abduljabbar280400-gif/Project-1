import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import NetworkError from '../../components/NetworkError';
import { FiShoppingBag, FiTruck, FiChevronRight } from 'react-icons/fi';
import SEO from '../../components/SEO';

export default function CustomerOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [draftCart, setDraftCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.customer.getOrders();
      setOrders(data?.data || data);
    } catch (err) {
      setError(err.message || 'Unable to fetch orders.');
    } finally {
      setLoading(false);
    }
  };

  const calculateDraftTotal = (cart) => {
    if (!cart || !cart.items) return 0;
    const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const DELIVERY_FEE = 3.00;
    const SERVICE_FEE = 1.50;
    return subtotal + DELIVERY_FEE + SERVICE_FEE;
  };

  useEffect(() => {
    fetchOrders();
    const storedCart = JSON.parse(localStorage.getItem('num_cart') || 'null');
    if (storedCart && storedCart.items && storedCart.items.length > 0) {
      setDraftCart(storedCart);
    } else {
      setDraftCart(null);
    }
  }, []);

  if (loading) return <LoadingSpinner message="Retrieving your order logs..." />;

  if (error) {
    return (
      <div className="py-12">
        <NetworkError message={error} onRetry={fetchOrders} />
      </div>
    );
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6 pb-8 select-none">
      <SEO title="My Order History" description="Keep track of your active deliveries, pending chef preparations, and history of past orders on Num Num." />
      <div>
        <h2 className="text-xl font-extrabold leading-none" style={{ color: 'var(--text-head)' }}>My Orders</h2>
        <p className="text-xs font-bold uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>Complete order logs & tracking</p>
      </div>

      {(orders.length === 0 && !draftCart) ? (
        <div className="card-solid p-8 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)' }}>
            <FiShoppingBag size={28} />
          </div>
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-head)' }}>No orders placed yet</h3>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>You haven't ordered anything yet. Ready to try Num Num?</p>
          <button
            onClick={() => navigate('/customer/browse')}
            className="btn-primary mt-6 w-auto px-6 cursor-pointer"
          >
            Browse Restaurants
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {draftCart && (
            <div
              onClick={() => navigate(`/customer/restaurants/${draftCart.restaurant_id}`)}
              className="card-solid transition-all cursor-pointer flex items-center justify-between p-4 shadow-md hover:shadow-lg relative overflow-hidden"
              style={{
                border: '1.5px solid #d97706',
                background: 'linear-gradient(to right, var(--bg-panel), var(--bg-input))'
              }}
            >
              <div className="absolute top-0 left-0 w-full h-[3px] bg-amber-500 animate-pulse"></div>
              
              <div className="flex-1 space-y-1.5 pr-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black truncate max-w-[150px]" style={{ color: 'var(--text-head)' }}>
                    {draftCart.restaurant_name || 'Chef Kitchen'}
                  </span>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded text-white bg-amber-600 animate-pulse">
                    DRAFT
                  </span>
                </div>

                <p className="text-[10px] font-semibold truncate max-w-[280px]" style={{ color: 'var(--text-body)' }}>
                  {draftCart.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                </p>

                <div className="flex items-center gap-2 text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>
                  <span className="text-[9px] font-black uppercase text-amber-600" style={{ letterSpacing: '0.05em' }}>In Cart</span>
                  <span>•</span>
                  <span style={{ color: '#7D5A50' }}>₹{calculateDraftTotal(draftCart).toFixed(2)}</span>
                  <span>•</span>
                  <span>{draftCart.items.reduce((acc, item) => acc + item.quantity, 0)} item{draftCart.items.length !== 1 ? 's' : ''}</span>
                </div>

                <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider mt-1" style={{ color: '#d97706' }}>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                  Click to continue ordering
                </span>
              </div>

              <div style={{ color: '#d97706' }}>
                <FiChevronRight size={18} className="translate-x-0 hover:translate-x-1 transition-transform" />
              </div>
            </div>
          )}

          {orders.map(order => {
            const isFinished = ['delivered', 'cancelled', 'rejected'].includes(order.status);
            
            return (
              <div
                key={order.id}
                onClick={() => navigate(`/customer/orders/${order.id}`)}
                className="card-solid transition-all cursor-pointer flex items-center justify-between p-4 shadow-sm"
              >
                <div className="flex-1 space-y-1.5 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black truncate max-w-[150px]" style={{ color: 'var(--text-head)' }}>
                      {order.restaurant_name || 'Chef Kitchen'}
                    </span>
                    <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded text-white ${
                      order.status === 'delivered' ? 'bg-emerald-600' :
                      ['cancelled', 'rejected'].includes(order.status) ? 'bg-slate-400' :
                      'animate-pulse'
                    }`} style={!['delivered','cancelled','rejected'].includes(order.status) ? { backgroundColor: '#B4846C' } : {}}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>
                    <span>{formatDate(order.created_at)}</span>
                    <span>•</span>
                    <span style={{ color: '#7D5A50' }}>₹{Number(order.total_amount).toFixed(2)}</span>
                    <span>•</span>
                    <span>{order.order_items?.length || 0} item{order.order_items?.length !== 1 ? 's' : ''}</span>
                  </div>

                  {!isFinished && (
                    <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider mt-1" style={{ color: '#7D5A50' }}>
                      <FiTruck className="animate-bounce" /> Click to track delivery live
                    </span>
                  )}
                </div>

                <div style={{ color: 'var(--text-muted)' }}>
                  <FiChevronRight size={18} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
