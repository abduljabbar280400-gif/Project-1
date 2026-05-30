import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import NetworkError from '../../components/NetworkError';
import { FiArrowLeft, FiPlus, FiMinus, FiShoppingBag } from 'react-icons/fi';

export default function RestaurantMenu() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartQuantities, setCartQuantities] = useState({});

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      const response = await api.customer.getRestaurantMenu(restaurantId);
      setRestaurant(response.restaurant?.data || response.restaurant);
      setMenuItems(response.menu_items?.data || response.menu_items || []);

      const storedCart = JSON.parse(localStorage.getItem('num_cart') || 'null');
      if (storedCart && Number(storedCart.restaurant_id) === Number(restaurantId)) {
        const qtys = {};
        storedCart.items.forEach(item => { qtys[item.menu_item_id] = item.quantity; });
        setCartQuantities(qtys);
      } else {
        setCartQuantities({});
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve menu. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [restaurantId]);

  const updateQuantity = (itemId, change) => {
    setCartQuantities(prev => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, current + change);
      const updated = { ...prev };
      if (next === 0) delete updated[itemId]; else updated[itemId] = next;
      saveCartToLocalStorage(updated);
      return updated;
    });
  };

  const saveCartToLocalStorage = (quantities) => {
    const activeItems = Object.keys(quantities).map(id => {
      const menuItem = menuItems.find(item => Number(item.id) === Number(id));
      return {
        menu_item_id: Number(id), name: menuItem?.name,
        price: Number(menuItem?.price), quantity: quantities[id]
      };
    });

    if (activeItems.length > 0) {
      localStorage.setItem('num_cart', JSON.stringify({
        restaurant_id: Number(restaurantId),
        restaurant_name: restaurant?.name,
        items: activeItems
      }));
    } else {
      localStorage.removeItem('num_cart');
    }
  };

  const getCartTotals = () => {
    let count = 0; let price = 0;
    Object.keys(cartQuantities).forEach(id => {
      const item = menuItems.find(m => Number(m.id) === Number(id));
      if (item) {
        const qty = cartQuantities[id];
        count += qty; price += (Number(item.price) * qty);
      }
    });
    return { count, price };
  };

  const { count: totalCount, price: totalPrice } = getCartTotals();

  if (loading) return <LoadingSpinner message="Cooking up the menu..." />;

  if (error) {
    return (
      <div className="py-12">
        <NetworkError message={error} onRetry={fetchData} />
      </div>
    );
  }

  const categories = menuItems.reduce((acc, item) => {
    const cat = item.category || 'Mains';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6 pb-28 relative select-none">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/customer/browse')}
          className="touch-target rounded-xl shadow-sm cursor-pointer"
          style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-body)' }}
        >
          <FiArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-lg font-extrabold leading-none" style={{ color: 'var(--text-head)' }}>{restaurant?.name}</h2>
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Kitchen & Chef Menu</span>
        </div>
      </div>

      <div className="card-solid p-0 overflow-hidden shadow-sm" style={{ border: '1px solid var(--border)' }}>
        <div className="h-24 flex items-center justify-center p-4 relative" style={{ background: 'linear-gradient(135deg, #B4846C, #E5B299)' }}>
          {restaurant?.banner_image ? (
            <img src={restaurant.banner_image} alt={restaurant.name} className="absolute inset-0 w-full h-full object-cover opacity-80" />
          ) : (
            <span className="text-white/20 text-4xl font-extrabold select-none tracking-tight">Num Num Chef</span>
          )}
        </div>
        <div className="p-4 space-y-2" style={{ backgroundColor: 'var(--bg-panel)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-head)' }}>{restaurant?.description}</p>
          <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>📍 {restaurant?.address}</div>
          <div className="pt-2 flex gap-1.5">
            <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded text-white ${restaurant?.is_open ? 'bg-emerald-600' : 'bg-slate-500'}`}>
              {restaurant?.is_open ? 'Accepting Orders' : 'Closed'}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {Object.keys(categories).map(categoryName => (
          <div key={categoryName} className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider pb-1.5" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
              {categoryName}
            </h3>
            <div className="space-y-3">
              {categories[categoryName].map(item => {
                const quantity = cartQuantities[item.id] || 0;
                return (
                  <div key={item.id} className="p-4 rounded-2xl flex items-center justify-between shadow-sm transition-colors"
                    style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border)' }}>
                    <div className="flex-1 pr-4">
                      <h4 className="text-sm font-extrabold" style={{ color: 'var(--text-head)' }}>{item.name}</h4>
                      <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>₹{Number(item.price).toFixed(2)}</p>
                      <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-body)' }}>{item.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {quantity > 0 ? (
                        <div className="flex items-center gap-3 px-2 py-1 rounded-xl" style={{ backgroundColor: 'var(--bg-input)' }}>
                          <button onClick={() => updateQuantity(item.id, -1)}
                            className="w-8 h-8 rounded-lg shadow-sm flex items-center justify-center font-bold cursor-pointer select-none"
                            style={{ backgroundColor: 'var(--bg-panel)', color: 'var(--text-head)' }}>
                            <FiMinus size={14} />
                          </button>
                          <span className="text-sm font-extrabold w-4 text-center select-none" style={{ color: 'var(--text-head)' }}>{quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)}
                            className="w-8 h-8 rounded-lg shadow-sm flex items-center justify-center font-bold cursor-pointer select-none"
                            style={{ backgroundColor: 'var(--bg-panel)', color: 'var(--text-head)' }}>
                            <FiPlus size={14} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => updateQuantity(item.id, 1)}
                          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm cursor-pointer transition-all select-none text-white"
                          style={{ backgroundColor: '#B4846C' }}>
                          <FiPlus size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {totalCount > 0 && (
        <div onClick={() => navigate('/customer/cart')}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 max-w-md w-[calc(100%-2rem)] text-white py-3.5 px-5 rounded-2xl flex items-center justify-between shadow-xl cursor-pointer transition-all select-none"
          style={{ backgroundColor: '#3e2820' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: '#B4846C' }}>
              <FiShoppingBag size={18} />
            </div>
            <div>
              <span className="text-xs font-bold block leading-none" style={{ color: '#E5B299' }}>YOUR CART</span>
              <span className="text-sm font-extrabold">{totalCount} item{totalCount > 1 ? 's' : ''} • ₹{totalPrice.toFixed(2)}</span>
            </div>
          </div>
          <span className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1" style={{ color: '#FCDEC0' }}>
            View Cart &rarr;
          </span>
        </div>
      )}

    </div>
  );
}
