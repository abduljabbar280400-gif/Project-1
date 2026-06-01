import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import NetworkError from '../../components/NetworkError';
import { FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import SEO from '../../components/SEO';

const inputStyles = { backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-head)' };
const labelStyle = { color: 'var(--text-muted)' };
const inputFocus = (e) => { e.target.style.borderColor = '#B4846C'; };
const inputBlur = (e) => { e.target.style.borderColor = 'var(--border)'; };

export default function MenuManagement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Mains');
  const [image, setImage] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

  const fetchMenu = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.chef.getMenu();
      setItems(data?.data || data);
    } catch (err) {
      setError(err.message || 'Failed to load menu items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMenu(); }, []);

  const openAddModal = () => {
    setEditingItem(null); setName(''); setDescription(''); setPrice('');
    setCategory('Mains'); setImage(''); setIsAvailable(true); setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item); setName(item.name); setDescription(item.description || '');
    setPrice(item.price); setCategory(item.category || 'Mains');
    setImage(item.image || ''); setIsAvailable(item.is_available); setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price || !category) { alert('Please fill in all required fields.'); return; }
    setFormLoading(true);
    const payload = { name, description: description || null, price: Number(price), category, image: image || null, is_available: isAvailable };
    try {
      if (editingItem) { await api.chef.updateMenuItem(editingItem.id, payload); }
      else { await api.chef.storeMenuItem(payload); }
      setIsModalOpen(false); fetchMenu();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save menu item.');
    } finally { setFormLoading(false); }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this dish from the menu?')) return;
    try { await api.chef.destroyMenuItem(itemId); fetchMenu(); }
    catch (err) { alert('Failed to delete item.'); }
  };

  if (loading) return <LoadingSpinner message="Retrieving kitchen menu..." />;

  if (error) {
    return (
      <div className="py-12">
        <NetworkError message={error} onRetry={fetchMenu} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 select-none">
      <SEO title="Manage Chef Kitchen Menu" description="Create new menu offerings, update dish descriptions, customize prices, and toggle item availability status." />

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold leading-none" style={{ color: 'var(--text-head)' }}>Menu Management</h2>
          <p className="text-xs font-bold uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>Configure kitchen catalog & pricing</p>
        </div>
        <button
          onClick={openAddModal}
          className="btn-primary w-auto py-2.5 px-4 text-xs font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer select-none"
        >
          <FiPlus size={16} /> Add Item
        </button>
      </div>

      {items.length === 0 ? (
        <div className="card-solid p-8 text-center">
          <span className="text-5xl block mb-2" style={{ color: 'var(--text-muted)' }}>🍽️</span>
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-head)' }}>Your menu is empty</h3>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Add items to allow customers to order from your kitchen!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(item => (
            <div
              key={item.id}
              className={`card-solid flex items-center gap-3 justify-between p-4 shadow-sm hover:shadow-md transition-all ${!item.is_available ? 'opacity-70 border-dashed' : ''
                }`}
            >
              {/* Item Image Thumbnail */}
              <div
                className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center text-2xl"
                style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)' }}
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                  />
                ) : null}
                <span style={{ display: item.image ? 'none' : 'flex' }} className="w-full h-full items-center justify-center">🍽️</span>
              </div>

              <div className="flex-1 pr-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold leading-tight" style={{ color: 'var(--text-head)' }}>{item.name}</h3>
                  <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded text-white ${item.is_available ? 'bg-emerald-600' : 'bg-slate-400'
                    }`}>
                    {item.is_available ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-bold mt-1" style={{ color: 'var(--text-muted)' }}>
                  <span className="px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)' }}>{item.category}</span>
                  <span>•</span>
                  <span style={{ color: '#7D5A50' }}>₹{Number(item.price).toFixed(2)}</span>
                </div>

                <p className="text-xs mt-1.5 line-clamp-1" style={{ color: 'var(--text-muted)' }}>{item.description}</p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditModal(item)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer shadow-sm"
                  style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-body)' }}
                  title="Edit item"
                  aria-label={`Edit ${item.name}`}
                >
                  <FiEdit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer shadow-sm text-rose-500"
                  style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)' }}
                  title="Delete item"
                  aria-label={`Delete ${item.name}`}
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center p-4">
          <div className="max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
            style={{ backgroundColor: 'var(--bg-panel)' }}>

            <div className="flex justify-between items-center pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="text-base font-extrabold" style={{ color: 'var(--text-head)' }}>
                {editingItem ? 'Edit Dish Details' : 'Add New Dish'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)' }}
              >
                <FiX size={16} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label htmlFor="input-dish-name" className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={labelStyle}>Dish Name</label>
                <input type="text" id="input-dish-name" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 font-medium text-sm transition-all outline-none"
                  style={inputStyles} onFocus={inputFocus} onBlur={inputBlur}
                  placeholder="e.g. Classic Pepperoni Pizza" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="input-price" className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={labelStyle}>Price (₹)</label>
                  <input type="number" id="input-price" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 font-medium text-sm transition-all outline-none"
                    style={inputStyles} onFocus={inputFocus} onBlur={inputBlur}
                    placeholder="12.99" required />
                </div>
                <div>
                  <label htmlFor="select-category" className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={labelStyle}>Category</label>
                  <select id="select-category" value={category} onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 font-bold text-xs uppercase transition-all outline-none"
                    style={inputStyles} onFocus={inputFocus} onBlur={inputBlur}>
                    <option value="Mains">Mains</option>
                    <option value="Starters">Starters</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Sides">Sides</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="input-image-url" className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={labelStyle}>Image URL (Optional)</label>
                <input type="url" id="input-image-url" value={image} onChange={(e) => setImage(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 font-medium text-sm transition-all outline-none"
                  style={inputStyles} onFocus={inputFocus} onBlur={inputBlur}
                  placeholder="https://images.unsplash.com/..." />
              </div>

              <div>
                <label htmlFor="input-description" className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={labelStyle}>Description</label>
                <textarea id="input-description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 font-medium text-sm transition-all outline-none resize-none"
                  style={inputStyles} onFocus={inputFocus} onBlur={inputBlur}
                  placeholder="Provide details about ingredients, dietary markers, size, etc." />
              </div>

              {editingItem && (
                <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                  <div>
                    <span className="block text-xs font-bold leading-none" style={{ color: 'var(--text-head)' }}>Dish Stock Availability</span>
                    <span className="text-[9px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Disable if out of ingredients</span>
                  </div>
                  <input type="checkbox" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} className="w-5 h-5 accent-brand-500 cursor-pointer" />
                </div>
              )}

              <button type="submit" disabled={formLoading} className="btn-primary w-full py-3.5 font-bold mt-2 uppercase tracking-wider cursor-pointer">
                {formLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
