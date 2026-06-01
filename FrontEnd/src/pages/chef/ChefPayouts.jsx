import { FaRupeeSign } from 'react-icons/fa';
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import NetworkError from '../../components/NetworkError';
import { FiClock, FiPlus, FiArrowDownRight, FiCheckCircle, FiX } from 'react-icons/fi';
import SEO from '../../components/SEO';

const inputStyles = { backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-head)' };
const labelStyle = { color: 'var(--text-muted)' };
const inputFocus = (e) => { e.target.style.borderColor = '#B4846C'; };
const inputBlur = (e) => { e.target.style.borderColor = 'var(--border)'; };

export default function ChefPayouts() {
  const [earningsBalance, setEarningsBalance] = useState(0);
  const [payouts, setPayouts] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchPayoutData = async () => {
    setLoading(true); setError(null);
    try {
      const data = await api.chef.getPayouts();
      setEarningsBalance(data.earnings_balance || 0);
      setPayouts(data.payouts?.data || data.payouts || []);
      setCompletedOrders(data.completed_orders?.data || data.completed_orders || []);
    } catch (err) {
      setError(err.message || 'Unable to retrieve financial ledgers.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchPayoutData(); }, []);

  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !bankName || !accountNumber || !accountName) { alert('Please fill in all banking fields.'); return; }
    const amt = Number(amount);
    if (amt <= 0 || amt > earningsBalance) { alert('Please enter a valid amount within your Earnings Balance.'); return; }
    setFormLoading(true);
    try {
      const res = await api.chef.requestPayout({ amount: amt, bank_name: bankName, account_number: accountNumber, account_name: accountName });
      setIsModalOpen(false); setAmount('');
      setEarningsBalance(res.earnings_balance); fetchPayoutData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit payout request.');
    } finally { setFormLoading(false); }
  };

  if (loading) return <LoadingSpinner message="Retrieving balance ledger..." />;

  if (error) {
    return (<div className="py-12"><NetworkError message={error} onRetry={fetchPayoutData} /></div>);
  }

  const pendingPayoutsTotal = payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0);
  const completedPayoutsTotal = payouts.filter(p => p.status === 'completed').reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6 pb-8 select-none">
      <SEO title="Chef Earning & Payout Settings" description="Analyze weekly menu performance, request earnings payouts, and inspect completed transaction summaries." />

      <div>
        <h2 className="text-xl font-extrabold leading-none" style={{ color: 'var(--text-head)' }}>Earnings Balance</h2>
        <p className="text-xs font-bold uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>Platform settlements & Payout history</p>
      </div>

      {/* Balance widgets */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card-solid p-4 space-y-2" style={{ borderTop: '4px solid #B4846C' }}>
          <span className="text-[9px] font-extrabold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Earnings Balance</span>
          <span className="text-2xl font-black" style={{ color: 'var(--text-head)' }}>₹{earningsBalance.toFixed(2)}</span>
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={earningsBalance <= 0}
            className={`btn-primary py-2 px-3 text-[10px] font-black uppercase tracking-wider w-full mt-2 cursor-pointer ${earningsBalance <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <FiPlus size={12} /> Request Payout
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <div className="card-solid p-3.5 flex-1 flex flex-col justify-center">
            <span className="text-[9px] font-extrabold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Pending Payouts</span>
            <span className="text-lg font-extrabold text-amber-600">₹{pendingPayoutsTotal.toFixed(2)}</span>
          </div>
          <div className="card-solid p-3.5 flex-1 flex flex-col justify-center">
            <span className="text-[9px] font-extrabold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Total Disbursed</span>
            <span className="text-lg font-extrabold text-emerald-600">₹{completedPayoutsTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Orders Ledger */}
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Completed Orders Settlement</span>
        {completedOrders.length === 0 ? (
          <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>No settled orders yet.</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto rounded-2xl p-2" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border)' }}>
            {completedOrders.map(order => {
              const chefEarned = Number(order.subtotal) - Number(order.commission_amount);
              return (
                <div key={order.id} className="flex justify-between items-center text-xs p-2 rounded-lg" style={{ color: 'var(--text-body)' }}>
                  <div>
                    <span className="font-extrabold block" style={{ color: 'var(--text-head)' }}>Order #{order.id}</span>
                    <span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>Subtotal: ₹{Number(order.subtotal).toFixed(2)} | Comm: -₹{Number(order.commission_amount).toFixed(2)}</span>
                  </div>
                  <span className="font-bold text-emerald-600">+₹{chefEarned.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payout History */}
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Payout Requests History</span>
        {payouts.length === 0 ? (
          <div className="card-solid p-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>No payouts requested yet.</div>
        ) : (
          <div className="space-y-3">
            {payouts.map(p => (
              <div key={p.id} className="card-solid p-3 flex items-center justify-between shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black" style={{ color: 'var(--text-head)' }}>₹{Number(p.amount).toFixed(2)}</span>
                    <span className={`text-[8px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded text-white ${p.status === 'completed' ? 'bg-emerald-600' : 'bg-amber-500'}`}>{p.status}</span>
                  </div>
                  <span className="text-[10px] font-semibold block" style={{ color: 'var(--text-muted)' }}>🏦 {p.bank_name} • A/C {p.account_number}</span>
                </div>
                <div>{p.status === 'completed' ? <FiCheckCircle className="text-emerald-500" size={18} /> : <FiClock className="text-amber-500 animate-pulse" size={18} />}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payout Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center p-4">
          <div className="max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg-panel)' }}>
            <div className="flex justify-between items-center pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="text-base font-extrabold" style={{ color: 'var(--text-head)' }}>Request Payout</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                <FiX size={16} />
              </button>
            </div>
            <form onSubmit={handlePayoutSubmit} className="space-y-4">
              <div>
                <label htmlFor="input-amount" className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={labelStyle}>Amount to Payout (₹)</label>
                <input type="number" id="input-amount" step="0.01" max={earningsBalance} value={amount} onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 font-bold text-sm outline-none transition-all" style={inputStyles}
                  onFocus={inputFocus} onBlur={inputBlur} placeholder={`Max ₹${earningsBalance.toFixed(2)}`} required />
              </div>
              <div>
                <label htmlFor="input-bank-name" className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={labelStyle}>Bank Name</label>
                <input type="text" id="input-bank-name" value={bankName} onChange={(e) => setBankName(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 font-medium text-sm outline-none transition-all" style={inputStyles}
                  onFocus={inputFocus} onBlur={inputBlur} placeholder="e.g. Chase Bank" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="input-account-number" className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={labelStyle}>Account Number</label>
                  <input type="text" id="input-account-number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 font-medium text-sm outline-none transition-all" style={inputStyles}
                    onFocus={inputFocus} onBlur={inputBlur} placeholder="1234567890" required />
                </div>
                <div>
                  <label htmlFor="input-account-name" className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={labelStyle}>Account Name</label>
                  <input type="text" id="input-account-name" value={accountName} onChange={(e) => setAccountName(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 font-medium text-sm outline-none transition-all" style={inputStyles}
                    onFocus={inputFocus} onBlur={inputBlur} placeholder="e.g. Mario Rossi" required />
                </div>
              </div>
              <button type="submit" disabled={formLoading} className="btn-primary w-full py-3.5 font-bold uppercase tracking-wider cursor-pointer">
                {formLoading ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
