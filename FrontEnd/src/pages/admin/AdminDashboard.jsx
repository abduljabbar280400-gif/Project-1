import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import NetworkError from '../../components/NetworkError';
import { FiCheckCircle, FiAlertTriangle, FiSliders, FiShoppingBag, FiTruck } from 'react-icons/fi';
import SEO from '../../components/SEO';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('restaurants');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [restaurants, setRestaurants] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [orders, setOrders] = useState([]);

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      if (activeTab === 'restaurants') {
        const data = await api.admin.getRestaurants();
        setRestaurants(data?.data || data);
      } else if (activeTab === 'payouts') {
        const data = await api.admin.getPayouts();
        setPayouts(data?.data || data);
      } else if (activeTab === 'orders') {
        const data = await api.admin.getOrders();
        setOrders(data?.data || data);
      }
    } catch (err) {
      setError(err.message || 'Unable to retrieve administrative logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [activeTab]);

  const handleToggleActive = async (restId) => {
    try {
      const res = await api.admin.toggleActive(restId);
      setRestaurants(prev => prev.map(r => r.id === restId ? { ...r, is_active: res.restaurant.is_active } : r));
    } catch (err) { alert('Failed to update restaurant status.'); }
  };

  const handleProcessPayout = async (payoutId) => {
    if (!window.confirm('Approve and process this bank transfer request?')) return;
    try {
      const res = await api.admin.processPayout(payoutId);
      setPayouts(prev => prev.map(p => p.id === payoutId ? { ...p, status: res.payout.status } : p));
      alert('Payout successfully marked as processed.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process payout.');
    }
  };

  if (loading) return <LoadingSpinner message="Syncing system administration database..." />;

  return (
    <div className="space-y-6 pb-8 select-none">
      <SEO title="Platform Administration Portal" description="Supervise partner chefs, review pending payouts, update settings, and manage platform configurations." />
      
      <div>
        <h2 className="text-xl font-extrabold leading-none font-sans" style={{ color: 'var(--text-head)' }}>Platform Operations Panel</h2>
        <p className="text-xs font-bold uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>Operational MVP Administration Layer</p>
      </div>

      <div className="grid grid-cols-3 gap-2 p-1 rounded-xl" style={{ backgroundColor: 'var(--bg-input)' }}>
        <button onClick={() => setActiveTab('restaurants')}
          className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${activeTab === 'restaurants' ? 'shadow-sm' : 'hover:opacity-80'}`}
          style={activeTab === 'restaurants' ? { backgroundColor: 'var(--bg-panel)', color: 'var(--text-head)' } : { color: 'var(--text-muted)' }}>
          Kitchens
        </button>
        <button onClick={() => setActiveTab('payouts')}
          className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${activeTab === 'payouts' ? 'shadow-sm' : 'hover:opacity-80'}`}
          style={activeTab === 'payouts' ? { backgroundColor: 'var(--bg-panel)', color: 'var(--text-head)' } : { color: 'var(--text-muted)' }}>
          Payouts
        </button>
        <button onClick={() => setActiveTab('orders')}
          className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${activeTab === 'orders' ? 'shadow-sm' : 'hover:opacity-80'}`}
          style={activeTab === 'orders' ? { backgroundColor: 'var(--bg-panel)', color: 'var(--text-head)' } : { color: 'var(--text-muted)' }}>
          All Orders
        </button>
      </div>

      {error && (
        <div className="py-6"><NetworkError message={error} onRetry={fetchData} /></div>
      )}

      {!error && (
        <div className="space-y-4">
          
          {activeTab === 'restaurants' && (
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Registered Kitchens ({restaurants.length})
              </span>
              {restaurants.map(rest => (
                <div key={rest.id} className="card-solid p-4 flex items-center justify-between shadow-sm" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border)' }}>
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold" style={{ color: 'var(--text-head)' }}>{rest.name}</h3>
                      <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded text-white ${rest.is_open ? 'bg-emerald-600' : 'bg-slate-400'}`}>
                        {rest.is_open ? 'Open' : 'Closed'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold block mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Chef: {rest.user?.name} | {rest.address}
                    </span>
                  </div>
                  <button onClick={() => handleToggleActive(rest.id)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm transition-colors cursor-pointer ${
                      rest.is_active ? 'bg-rose-500 hover:bg-rose-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    }`}>
                    {rest.is_active ? 'Suspend' : 'Activate'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'payouts' && (
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Payout Disbursement Requests ({payouts.length})
              </span>
              {payouts.length === 0 ? (
                <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>No payout requests in history.</p>
              ) : (
                <div className="space-y-3">
                  {payouts.map(p => (
                    <div key={p.id} className="card-solid p-4 space-y-3 shadow-sm" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border)' }}>
                      <div className="flex justify-between items-start pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
                        <div>
                          <span className="text-sm font-black" style={{ color: 'var(--text-head)' }}>₹{Number(p.amount).toFixed(2)}</span>
                          <span className="text-[9px] font-bold block mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            User: {p.user?.name} ({p.user?.role})
                          </span>
                        </div>
                        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded text-white ${
                          p.status === 'processed' || p.status === 'completed' ? 'bg-emerald-600' : 'bg-amber-500'
                        }`}>
                          {p.status}
                        </span>
                      </div>
                      <div className="text-[10px] font-semibold space-y-1 p-2.5 rounded-xl" style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-body)' }}>
                        <span className="block"><span className="font-extrabold" style={{ color: 'var(--text-muted)' }}>BANK:</span> {p.bank_name}</span>
                        <span className="block"><span className="font-extrabold" style={{ color: 'var(--text-muted)' }}>A/C NAME:</span> {p.account_name}</span>
                        <span className="block"><span className="font-extrabold" style={{ color: 'var(--text-muted)' }}>A/C NUMBER:</span> {p.account_number}</span>
                      </div>
                      {p.status === 'pending' && (
                        <button onClick={() => handleProcessPayout(p.id)} className="btn-success py-2 text-xs font-black uppercase tracking-wider cursor-pointer">
                          Approve Bank Transfer
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                System-Wide Order logs ({orders.length})
              </span>
              {orders.map(order => (
                <div key={order.id} className="card-solid p-4 space-y-2 shadow-sm text-xs font-medium" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-body)' }}>
                  <div className="flex justify-between items-center font-extrabold" style={{ color: 'var(--text-head)' }}>
                    <span>Order #{order.id}</span>
                    <span style={{ color: '#7D5A50' }}>₹{Number(order.total_amount).toFixed(2)}</span>
                  </div>
                  <div className="space-y-0.5 text-[10px]">
                    <span className="block"><span className="font-bold">Restaurant:</span> {order.restaurant_name}</span>
                    <span className="block"><span className="font-bold">Customer:</span> {order.customer_name}</span>
                    <span className="block"><span className="font-bold">Driver:</span> {order.driver_name || 'Unassigned'}</span>
                    <span className="block"><span className="font-bold">Status:</span> {order.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
