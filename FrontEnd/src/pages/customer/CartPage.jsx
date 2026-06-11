import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FiArrowLeft, FiPlus, FiMinus, FiTrash2, FiMapPin, FiClipboard, FiZap } from 'react-icons/fi';
import SEO from '../../components/SEO';

export default function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // Extra-order state
  const [activeOrder, setActiveOrder] = useState(null);
  const [addToExisting, setAddToExisting] = useState(false);

  const DELIVERY_FEE = 3.00;
  const SERVICE_FEE = 1.50;

  const formatFullAddress = (addr) => {
    return `${addr.door_no}, ${addr.street}, ${addr.area}${addr.landmark ? `, Near ${addr.landmark}` : ''}, ${addr.city} - ${addr.pincode}`;
  };

  const fetchAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const data = await api.customer.getAddresses();
      const addrList = data?.data || data || [];
      setAddresses(addrList);

      const active = addrList.find(a => a.is_selected);
      if (active) {
        setDeliveryAddress(formatFullAddress(active));
      } else if (addrList.length > 0) {
        setDeliveryAddress(formatFullAddress(addrList[0]));
      }
    } catch (err) {
      console.error('Failed to fetch address book', err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const fetchActiveOrder = async (restaurantId) => {
    try {
      const ordersData = await api.customer.getOrders();
      const orders = ordersData?.data || ordersData || [];
      const found = orders.find(o => {
        if (Number(o.restaurant_id) !== Number(restaurantId)) return false;
        if (!['accepted', 'preparing'].includes(o.status)) return false;
        
        const createdAt = new Date(o.created_at);
        const diffMs = new Date() - createdAt;
        const diffMins = diffMs / 1000 / 60;
        return diffMins <= 15;
      });
      setActiveOrder(found || null);
    } catch (_) {
      setActiveOrder(null);
    }
  };

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem('num_cart') || 'null');
    setCart(storedCart);
    fetchAddresses();
    if (storedCart?.restaurant_id) {
      fetchActiveOrder(storedCart.restaurant_id);
    }
  }, []);

  const updateQuantity = (itemId, change) => {
    if (!cart) return;
    const updatedItems = cart.items.map(item => {
      if (item.menu_item_id === itemId) return { ...item, quantity: Math.max(0, item.quantity + change) };
      return item;
    }).filter(item => item.quantity > 0);

    if (updatedItems.length > 0) {
      const updatedCart = { ...cart, items: updatedItems };
      setCart(updatedCart); localStorage.setItem('num_cart', JSON.stringify(updatedCart));
    } else {
      setCart(null); localStorage.removeItem('num_cart');
    }
  };

  const removeItem = (itemId) => {
    if (!cart) return;
    const updatedItems = cart.items.filter(item => item.menu_item_id !== itemId);
    if (updatedItems.length > 0) {
      const updatedCart = { ...cart, items: updatedItems };
      setCart(updatedCart); localStorage.setItem('num_cart', JSON.stringify(updatedCart));
    } else {
      setCart(null); localStorage.removeItem('num_cart');
    }
  };

  const getSubtotal = () => {
    if (!cart) return 0;
    return cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!cart) return;
    setSubmitting(true); setError('');

    // ── Add Extras to Existing Order ──
    if (addToExisting && activeOrder) {
      try {
        const payload = {
          items: cart.items.map(item => ({ menu_item_id: item.menu_item_id, quantity: item.quantity }))
        };
        await api.customer.addExtraItems(activeOrder.id, payload);
        localStorage.removeItem('num_cart');
        navigate(`/customer/orders/${activeOrder.id}`);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to add extra items.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // ── Normal New Order ──
    if (!deliveryAddress.trim()) { setError('Delivery address is required.'); setSubmitting(false); return; }
    const selectedAddressObj = addresses.find(a => formatFullAddress(a) === deliveryAddress);

    const orderPayload = {
      restaurant_id: cart.restaurant_id,
      delivery_address: deliveryAddress,
      special_instructions: specialInstructions || null,
      dropoff_latitude: selectedAddressObj?.latitude || null,
      dropoff_longitude: selectedAddressObj?.longitude || null,
      items: cart.items.map(item => ({ menu_item_id: item.menu_item_id, quantity: item.quantity }))
    };
    try {
      const response = await api.customer.placeOrder(orderPayload);
      localStorage.removeItem('num_cart');
      navigate(`/customer/orders/${response.order.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Please check details.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!cart) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center py-20 select-none">
        <span className="text-6xl mb-4" style={{ color: 'var(--text-muted)' }}>🛒</span>
        <h3 className="text-base font-extrabold" style={{ color: 'var(--text-head)' }}>Your cart is empty</h3>
        <p className="text-xs mt-1 text-center max-w-[200px]" style={{ color: 'var(--text-muted)' }}>Go to browse and add delicious dishes to start your order!</p>
        <button onClick={() => navigate('/customer/browse')} className="btn-primary mt-6 w-auto px-6 cursor-pointer">
          Browse Restaurants
        </button>
      </div>
    );
  }

  const subtotal = getSubtotal();
  const effectiveDeliveryFee = addToExisting ? 0 : DELIVERY_FEE;
  const effectiveServiceFee = addToExisting ? 0 : SERVICE_FEE;
  const total = subtotal + effectiveDeliveryFee + effectiveServiceFee;

  return (
    <div className="space-y-6 pb-8 select-none">
      <SEO title="Review Your Cart & Checkout" description="Confirm your ordered food items, select your delivery address, write kitchen instructions, and securely place your order." />
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/customer/restaurants/${cart.restaurant_id}`)}
          className="touch-target rounded-xl shadow-sm cursor-pointer"
          style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-body)' }}
          aria-label="Back to restaurant menu"
        >
          <FiArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-lg font-extrabold leading-none" style={{ color: 'var(--text-head)' }}>Checkout</h2>
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Review items & place order</span>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-3 rounded-lg text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Add to Active Order Banner */}
      {activeOrder && (
        <div
          className="p-4 rounded-2xl space-y-3 shadow-sm"
          style={{ background: 'linear-gradient(135deg, #3e2820, #5a3a28)', border: '1px solid #7D5A50' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#B4846C' }}>
              <FiZap size={14} className="text-white" />
            </div>
            <div>
              <span className="text-xs font-extrabold block" style={{ color: '#FCDEC0' }}>Active Order #{activeOrder.id} in Progress</span>
              <span className="text-[10px] font-semibold" style={{ color: '#E5B299' }}>Status: {activeOrder.status} — Chef is working on it</span>
            </div>
          </div>
          <label
            htmlFor="add-to-existing-toggle"
            className="flex items-start gap-3 p-3 rounded-xl cursor-pointer"
            style={{ backgroundColor: addToExisting ? 'rgba(180,132,108,0.25)' : 'rgba(255,255,255,0.05)', border: `1px solid ${addToExisting ? '#B4846C' : '#7D5A50'}` }}
          >
            <input
              type="checkbox"
              id="add-to-existing-toggle"
              checked={addToExisting}
              onChange={(e) => setAddToExisting(e.target.checked)}
              className="mt-0.5 w-4 h-4 cursor-pointer accent-amber-500 flex-shrink-0"
            />
            <div>
              <span className="text-xs font-extrabold block" style={{ color: '#FCDEC0' }}>Add these items to Order #{activeOrder.id}</span>
              <span className="text-[10px] font-semibold leading-relaxed" style={{ color: '#E5B299' }}>
                No delivery or service fee — you only pay for the added items. Chef will approve before charging.
              </span>
            </div>
          </label>
        </div>
      )}

      {/* Cart Items List */}
      <div className="card-solid p-4 space-y-4">
        <div className="pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="block text-[10px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Ordering From</span>
          <span className="text-sm font-extrabold" style={{ color: 'var(--text-head)' }}>{cart.restaurant_name}</span>
        </div>

        <div className="space-y-3.5">
          {cart.items.map(item => (
            <div key={item.menu_item_id} className="flex items-center justify-between">
              <div className="flex-1 pr-4">
                <span className="text-sm font-extrabold block leading-tight" style={{ color: 'var(--text-head)' }}>{item.name}</span>
                <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>₹{item.price.toFixed(2)} each</span>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="flex items-center gap-2.5 px-1.5 py-0.5 rounded-lg" style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                  <button
                    onClick={() => updateQuantity(item.menu_item_id, -1)}
                    className="w-6 h-6 rounded flex items-center justify-center font-bold cursor-pointer"
                    style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-head)' }}
                    aria-label={`Decrease quantity of ${item.name}`}
                  >
                    <FiMinus size={10} />
                  </button>
                  <span className="text-xs font-extrabold w-3 text-center" style={{ color: 'var(--text-head)' }}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.menu_item_id, 1)}
                    className="w-6 h-6 rounded flex items-center justify-center font-bold cursor-pointer"
                    style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-head)' }}
                    aria-label={`Increase quantity of ${item.name}`}
                  >
                    <FiPlus size={10} />
                  </button>
                </div>

                <button
                  onClick={() => removeItem(item.menu_item_id)}
                  className="w-8 h-8 flex items-center justify-center text-rose-500 cursor-pointer"
                  title="Remove item"
                  aria-label={`Remove ${item.name} from cart`}
                >
                  <FiTrash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handlePlaceOrder} className="space-y-6">
        {/* Address & Instructions — only shown for new orders */}
        {!addToExisting && (
          <div className="card-solid p-4 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider pb-2" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
              Delivery Details
            </h3>

            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold mb-3" style={{ color: 'var(--text-muted)' }}>
                <FiMapPin size={14} style={{ color: '#B4846C' }} />
                <span>SELECT DELIVERY ADDRESS</span>
              </div>

              {loadingAddresses ? (
                <div className="flex items-center gap-2 py-4 justify-center text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                  <LoadingSpinner size="sm" color="amber" />
                  <span>Loading your address book...</span>
                </div>
              ) : addresses.length === 0 ? (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs font-semibold space-y-3 shadow-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-base leading-none">⚠️</span>
                    <span>No delivery addresses found. Please add an address in your Profile to place this order.</span>
                  </div>
                  <button
                    type="button" onClick={() => navigate('/profile')}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-4 py-2 rounded-lg text-[10px] uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
                  >
                    Go to Profile & Add Address
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {addresses.map(addr => {
                    const fullStr = formatFullAddress(addr);
                    const isSelected = deliveryAddress === fullStr;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => setDeliveryAddress(fullStr)}
                        className="p-3.5 rounded-xl border text-left cursor-pointer transition-all select-none relative"
                        style={isSelected
                          ? { borderColor: '#B4846C', backgroundColor: 'var(--bg-input)' }
                          : { borderColor: 'var(--border)', backgroundColor: 'var(--bg-panel)' }}
                      >
                        <div className="flex items-start gap-2.5">
                          <input
                            type="radio" name="delivery_address_radio" checked={isSelected}
                            onChange={() => setDeliveryAddress(fullStr)}
                            className="mt-0.5 accent-brand-500"
                          />
                          <div>
                            <span className="text-xs font-extrabold block" style={{ color: 'var(--text-head)' }}>
                              {addr.door_no}, {addr.street}
                            </span>
                            <p className="text-[10px] font-semibold mt-0.5 leading-tight" style={{ color: 'var(--text-muted)' }}>
                              {addr.area}{addr.landmark ? `, Near ${addr.landmark}` : ''}, {addr.city} - {addr.pincode}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex items-center gap-1.5 text-xs font-bold mb-2" style={{ color: 'var(--text-muted)' }}>
                <FiClipboard size={14} style={{ color: '#B4846C' }} />
                <span>SPECIAL INSTRUCTIONS (OPTIONAL)</span>
              </div>
              <label htmlFor="special-instructions-input" className="sr-only">Special Instructions</label>
              <input
                type="text"
                id="special-instructions-input"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="e.g. Please leave at door, don't ring bell"
                className="w-full rounded-xl px-4 py-3 font-medium text-sm transition-all outline-none"
                style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-head)' }}
              />
            </div>
          </div>
        )}

        {/* Pricing Summary */}
        <div className="card-solid p-4 space-y-3.5">
          <h3 className="text-xs font-extrabold uppercase tracking-wider pb-2" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
            Bill Details
          </h3>
          <div className="flex justify-between text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
            <span>Item Subtotal</span><span>₹{subtotal.toFixed(2)}</span>
          </div>
          {addToExisting ? (
            <>
              <div className="flex justify-between text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                <span className="line-through opacity-50">Platform Service Fee</span>
                <span className="text-emerald-600 font-bold">FREE</span>
              </div>
              <div className="flex justify-between text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                <span className="line-through opacity-50">Standard Delivery Fee</span>
                <span className="text-emerald-600 font-bold">FREE</span>
              </div>
              <div className="text-[10px] font-semibold px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                💡 Adding to an existing order — no extra fees charged. Chef must approve before you pay.
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                <span>Platform Service Fee</span><span>₹{SERVICE_FEE.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                <span>Standard Delivery Fee</span><span>₹{DELIVERY_FEE.toFixed(2)}</span>
              </div>
            </>
          )}
          <div className="pt-3 flex justify-between items-center" style={{ borderTop: '1px solid var(--border)' }}>
            <span className="text-sm font-extrabold" style={{ color: 'var(--text-head)' }}>
              {addToExisting ? 'Extra Items Total' : 'Total Payable'}
            </span>
            <span className="text-lg font-black" style={{ color: '#7D5A50' }}>₹{total.toFixed(2)}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || (!addToExisting && addresses.length === 0)}
          className="btn-primary w-full py-4 text-sm uppercase tracking-wider font-extrabold cursor-pointer"
          id="btn-place-order"
        >
          {submitting
            ? <LoadingSpinner size="sm" color="white" />
            : addToExisting
              ? `Add Extras to Order #${activeOrder?.id} • ₹${total.toFixed(2)}`
              : `Place Order • ₹${total.toFixed(2)}`
          }
        </button>
      </form>

    </div>
  );
}
