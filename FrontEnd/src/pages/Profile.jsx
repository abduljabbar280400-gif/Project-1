import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import SEO from '../components/SEO';
import {
  FiLock,
  FiMapPin,
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiCheck,
  FiInfo,
  FiTruck,
  FiCoffee,
  FiUser,
  FiChevronDown
} from 'react-icons/fi';
import LocationPickerMap from '../components/maps/LocationPickerMap';

const CUISINE_OPTIONS = ['Italian', 'Fast Food', 'Burgers', 'Dessert', 'Indian', 'Healthy'];
const VEHICLE_OPTIONS = [
  { value: 'bike', label: 'Bicycle / Motorbike' },
  { value: 'scooter', label: 'Scooter' },
  { value: 'car', label: 'Car / Van' }
];

// Reusable input style object for dark mode compatibility
const inputStyles = {
  backgroundColor: 'var(--bg-input)',
  border: '1px solid var(--border)',
  color: 'var(--text-head)',
};
const disabledInputStyles = {
  backgroundColor: 'var(--bg-input)',
  border: '1px solid var(--border)',
  color: 'var(--text-muted)',
};
const labelStyle = { color: 'var(--text-muted)' };
const headingStyle = { color: 'var(--text-head)' };
const subTextStyle = { color: 'var(--text-muted)' };
const bodyTextStyle = { color: 'var(--text-body)' };

const inputFocus = (e) => { e.target.style.borderColor = '#B4846C'; };
const inputBlur = (e) => { e.target.style.borderColor = 'var(--border)'; };

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Profile photo state
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');

  // Chef state
  const [chefForm, setChefForm] = useState({
    name: '',
    description: '',
    door_no: '',
    street: '',
    area: '',
    landmark: '',
    pincode: '',
    city: '',
    cuisine_type: 'Fast Food',
    banner_image: '',
    latitude: null,
    longitude: null
  });

  // Delivery state
  const [deliveryForm, setDeliveryForm] = useState({
    vehicle_type: 'bike',
    licence_number: ''
  });

  // Customer Address Book state
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    door_no: '',
    street: '',
    area: '',
    landmark: '',
    pincode: '',
    city: '',
    latitude: null,
    longitude: null
  });

  // Fetch all user profile information
  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const res = await api.auth.profile();
      const userData = res.user || res;
      setUser(userData);
      setProfilePhotoUrl(userData.profile_photo || '');

      // Initialize role-specific forms
      if (userData.role === 'chef' && userData.restaurant) {
        setChefForm({
          name: userData.restaurant.name || '',
          description: userData.restaurant.description || '',
          door_no: userData.restaurant.door_no || '',
          street: userData.restaurant.street || '',
          area: userData.restaurant.area || '',
          landmark: userData.restaurant.landmark || '',
          pincode: userData.restaurant.pincode || '',
          city: userData.restaurant.city || '',
          cuisine_type: userData.restaurant.cuisine_type || 'Fast Food',
          banner_image: userData.restaurant.banner_image || '',
          latitude: userData.restaurant.latitude || null,
          longitude: userData.restaurant.longitude || null
        });
      } else if (userData.role === 'delivery' && userData.delivery_profile) {
        setDeliveryForm({
          vehicle_type: userData.delivery_profile.vehicle_type || 'bike',
          licence_number: userData.delivery_profile.licence_number || ''
        });
      } else if (userData.role === 'customer') {
        const addressData = await api.customer.getAddresses();
        setAddresses(addressData?.data || addressData || []);
      }
    } catch (err) {
      showMsg('error', 'Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  // Profile Photo Save Action
  const handleProfilePhotoSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.auth.updateProfilePhoto({ profile_photo: profilePhotoUrl });
      showMsg('success', 'Profile photo updated successfully!');

      const updatedUser = { ...user, profile_photo: res.user?.profile_photo || res.profile_photo };
      setUser(updatedUser);

      const stored = JSON.parse(localStorage.getItem('num_user') || '{}');
      stored.profile_photo = res.user?.profile_photo || res.profile_photo;
      localStorage.setItem('num_user', JSON.stringify(stored));
    } catch (err) {
      showMsg('error', 'Failed to update profile photo.');
    } finally {
      setSaving(false);
    }
  };

  // Chef Save Action
  const handleChefSave = async (e) => {
    e.preventDefault();
    if (
      !chefForm.name.trim() ||
      !chefForm.door_no.trim() ||
      !chefForm.street.trim() ||
      !chefForm.area.trim() ||
      !chefForm.pincode.trim() ||
      !chefForm.city.trim()
    ) {
      showMsg('error', 'Kitchen name and address fields (except landmark) are required.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.chef.updateProfile(chefForm);
      showMsg('success', 'Kitchen profile updated successfully!');

      // Update local storage representation in case user name matches kitchen
      const stored = JSON.parse(localStorage.getItem('num_user') || '{}');
      if (stored.restaurant) {
        stored.restaurant = res.restaurant;
        localStorage.setItem('num_user', JSON.stringify(stored));
      }
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Failed to update kitchen details.');
    } finally {
      setSaving(false);
    }
  };

  // Delivery Save Action
  const handleDeliverySave = async (e) => {
    e.preventDefault();
    if (!deliveryForm.licence_number.trim()) {
      showMsg('error', 'Licence number is required.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.delivery.updateProfile(deliveryForm);
      showMsg('success', 'Delivery profile updated successfully!');

      // Update local storage
      const stored = JSON.parse(localStorage.getItem('num_user') || '{}');
      if (stored.delivery_profile) {
        stored.delivery_profile = res.profile;
        localStorage.setItem('num_user', JSON.stringify(stored));
      }
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Failed to update delivery partner profile.');
    } finally {
      setSaving(false);
    }
  };

  // Address CRUD Handlers
  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    const { door_no, street, area, pincode, city } = addressForm;
    if (!door_no.trim() || !street.trim() || !area.trim() || !pincode.trim() || !city.trim()) {
      showMsg('error', 'Please fill in all required address fields.');
      return;
    }

    setSaving(true);
    try {
      if (editingAddressId) {
        // Edit Existing Address
        await api.customer.updateAddress(editingAddressId, addressForm);
        showMsg('success', 'Address updated successfully!');
      } else {
        // Add New Address
        await api.customer.addAddress(addressForm);
        showMsg('success', 'New address added to book!');
      }

      // Reset address form
      setAddressForm({ door_no: '', street: '', area: '', landmark: '', pincode: '', city: '', latitude: null, longitude: null });
      setShowAddressForm(false);
      setEditingAddressId(null);

      // Refresh list
      const addressData = await api.customer.getAddresses();
      setAddresses(addressData?.data || addressData || []);
    } catch (err) {
      showMsg('error', 'Failed to save address.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditAddressClick = (addr) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      door_no: addr.door_no || '',
      street: addr.street || '',
      area: addr.area || '',
      landmark: addr.landmark || '',
      pincode: addr.pincode || '',
      city: addr.city || '',
      latitude: addr.latitude || null,
      longitude: addr.longitude || null
    });
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await api.customer.deleteAddress(id);
      showMsg('success', 'Address removed successfully.');
      // Refresh list
      const addressData = await api.customer.getAddresses();
      setAddresses(addressData?.data || addressData || []);
    } catch (err) {
      showMsg('error', 'Failed to delete address.');
    }
  };

  const handleSelectAddress = async (id) => {
    try {
      const res = await api.customer.selectAddress(id);
      setAddresses(res.addresses || res.data || res || []);
      showMsg('success', 'Primary delivery address updated.');
    } catch (err) {
      showMsg('error', 'Failed to select address.');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center py-20">
        <LoadingSpinner size="lg" color="amber" />
        <span className="text-sm font-semibold mt-4" style={subTextStyle}>Loading your profile...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 select-none">
      <SEO title="My Account Profile" description="Manage your personal details, primary delivery address book, driving licence, and chef kitchen settings." />

      {/* Page Title Header */}
      <div>
        <h2 className="text-lg font-extrabold leading-none" style={headingStyle}>Account Profile</h2>
        <span className="text-[10px] font-bold uppercase tracking-wider" style={subTextStyle}>Manage your registry & preferences</span>
      </div>

      {/* Dynamic Status Message Alert */}
      {message.text && (
        <div className={`p-4 rounded-xl border text-xs font-bold shadow-sm transition-all ${message.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
          {message.text}
        </div>
      )}

      {/* READ-ONLY USER CARD */}
      <div className="card-solid p-5 space-y-4">
        <div className="flex flex-col items-center justify-center pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="relative mb-3">
            {user?.profile_photo ? (
              <img
                src={user.profile_photo}
                alt={user.name}
                className="w-24 h-24 rounded-full object-cover shadow-md"
                style={{ border: '2px solid #B4846C' }}
              />
            ) : (
              <div className="w-24 h-24 rounded-full flex items-center justify-center text-white font-extrabold text-2xl shadow-md uppercase"
                style={{ background: 'linear-gradient(135deg, #B4846C, #E5B299)' }}>
                {user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'U'}
              </div>
            )}
          </div>
          <h3 className="text-sm font-black" style={headingStyle}>{user?.name}</h3>
          <span className="text-[9px] font-extrabold text-white px-2 py-0.5 rounded-md uppercase tracking-wider mt-1 inline-block"
            style={{ backgroundColor: '#B4846C' }}>
            {user?.role} Account
          </span>

          <form onSubmit={handleProfilePhotoSave} className="w-full mt-4 space-y-1.5 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            <label htmlFor="input-profile-photo" className="block text-[9px] font-bold uppercase tracking-wider" style={labelStyle}>EDIT PROFILE PHOTO URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                id="input-profile-photo"
                value={profilePhotoUrl}
                onChange={e => setProfilePhotoUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="flex-1 rounded-xl px-3.5 py-2 text-xs font-semibold outline-none transition-colors"
                style={inputStyles}
                onFocus={inputFocus}
                onBlur={inputBlur}
              />
              <button
                type="submit"
                disabled={saving}
                className="text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: '#B4846C' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#7D5A50'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#B4846C'}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>

        {/* Read-only details book */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={labelStyle}>FULL NAME</span>
            </div>
            <input
              type="text"
              value={user?.name || ''}
              disabled
              className="w-full rounded-xl px-4 py-2.5 text-xs font-semibold select-none cursor-not-allowed"
              style={disabledInputStyles}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={labelStyle}>EMAIL ADDRESS</span>
            </div>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full rounded-xl px-4 py-2.5 text-xs font-semibold select-none cursor-not-allowed"
              style={disabledInputStyles}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={labelStyle}>PHONE NUMBER</span>
            </div>
            <input
              type="text"
              value={user?.phone || ''}
              disabled
              className="w-full rounded-xl px-4 py-2.5 text-xs font-semibold select-none cursor-not-allowed"
              style={disabledInputStyles}
            />
          </div>
        </div>
      </div>

      {/* ROLE-SPECIFIC EDITABLE SECTIONS */}

      {/* 1. CHEF PROFILE */}
      {user?.role === 'chef' && (
        <form onSubmit={handleChefSave} className="card-solid p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <FiCoffee size={18} style={{ color: '#B4846C' }} className="animate-pulse" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider" style={bodyTextStyle}>Kitchen & Restaurant Info</h3>
          </div>

          <div className="space-y-3.5">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={labelStyle}>KITCHEN NAME</span>
              <input
                type="text"
                value={chefForm.name}
                onChange={e => setChefForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your kitchen name"
                className="w-full rounded-xl px-4 py-3 text-xs font-semibold outline-none transition-colors"
                style={inputStyles}
                onFocus={inputFocus}
                onBlur={inputBlur}
                required
              />
            </div>

            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={labelStyle}>CUISINE TYPE</span>
              <div className="relative">
                <select
                  value={chefForm.cuisine_type}
                  onChange={e => setChefForm(prev => ({ ...prev, cuisine_type: e.target.value }))}
                  className="w-full rounded-xl pl-4 pr-10 py-3 text-xs font-semibold outline-none appearance-none transition-colors"
                  style={inputStyles}
                  onFocus={inputFocus}
                  onBlur={inputBlur}
                >
                  {CUISINE_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" size={14} style={subTextStyle} />
              </div>
              <span className="block text-[9px] mt-1 font-semibold" style={subTextStyle}>This helps customers filter your kitchen on their browse page.</span>
            </div>

            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={labelStyle}>KITCHEN BIO / DESCRIPTION</span>
              <textarea
                rows={3}
                value={chefForm.description}
                onChange={e => setChefForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Tell customers about your kitchen, specialties, etc."
                className="w-full rounded-xl px-4 py-3 text-xs font-semibold outline-none transition-colors resize-none"
                style={inputStyles}
                onFocus={inputFocus}
                onBlur={inputBlur}
              />
            </div>

            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={labelStyle}>KITCHEN BANNER / COVER PHOTO URL</span>
              <input
                type="url"
                value={chefForm.banner_image}
                onChange={e => setChefForm(prev => ({ ...prev, banner_image: e.target.value }))}
                placeholder="Enter cover photo image URL (https://...)"
                className="w-full rounded-xl px-4 py-3 text-xs font-semibold outline-none transition-colors"
                style={inputStyles}
                onFocus={inputFocus}
                onBlur={inputBlur}
              />
              <span className="block text-[9px] mt-1 font-semibold" style={subTextStyle}>This displays as a header banner on the customer browse page and restaurant menu.</span>
            </div>

            {/* Detailed Address Grid */}
            <div className="pt-4 space-y-3.5" style={{ borderTop: '1px solid var(--border)' }}>
              <span className="block text-[10px] font-bold uppercase tracking-wider" style={bodyTextStyle}>Kitchen Location & Address</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <span className="block text-[9px] font-bold uppercase tracking-wider mb-1" style={labelStyle}>DOOR NO / FLAT NO / FLOOR *</span>
                  <input
                    type="text"
                    value={chefForm.door_no}
                    onChange={e => setChefForm(prev => ({ ...prev, door_no: e.target.value }))}
                    placeholder="e.g. Door 45, Ground Floor"
                    className="w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none transition-colors"
                    style={inputStyles}
                    onFocus={inputFocus} onBlur={inputBlur}
                    required
                  />
                </div>

                <div className="col-span-2">
                  <span className="block text-[9px] font-bold uppercase tracking-wider mb-1" style={labelStyle}>STREET ADDRESS *</span>
                  <input
                    type="text"
                    value={chefForm.street}
                    onChange={e => setChefForm(prev => ({ ...prev, street: e.target.value }))}
                    placeholder="e.g. Baker Street"
                    className="w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none transition-colors"
                    style={inputStyles}
                    onFocus={inputFocus} onBlur={inputBlur}
                    required
                  />
                </div>

                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-wider mb-1" style={labelStyle}>AREA *</span>
                  <input
                    type="text"
                    value={chefForm.area}
                    onChange={e => setChefForm(prev => ({ ...prev, area: e.target.value }))}
                    placeholder="e.g. Marylebone"
                    className="w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none transition-colors"
                    style={inputStyles}
                    onFocus={inputFocus} onBlur={inputBlur}
                    required
                  />
                </div>

                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-wider mb-1" style={labelStyle}>LANDMARK (OPTIONAL)</span>
                  <input
                    type="text"
                    value={chefForm.landmark}
                    onChange={e => setChefForm(prev => ({ ...prev, landmark: e.target.value }))}
                    placeholder="e.g. Opposite Park"
                    className="w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none transition-colors"
                    style={inputStyles}
                    onFocus={inputFocus} onBlur={inputBlur}
                  />
                </div>

                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-wider mb-1" style={labelStyle}>PINCODE *</span>
                  <input
                    type="text"
                    value={chefForm.pincode}
                    onChange={e => setChefForm(prev => ({ ...prev, pincode: e.target.value }))}
                    placeholder="e.g. NW1 6XE"
                    className="w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none transition-colors"
                    style={inputStyles}
                    onFocus={inputFocus} onBlur={inputBlur}
                    required
                  />
                </div>

                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-wider mb-1" style={labelStyle}>CITY *</span>
                  <input
                    type="text"
                    value={chefForm.city}
                    onChange={e => setChefForm(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="e.g. London"
                    className="w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none transition-colors"
                    style={inputStyles}
                    onFocus={inputFocus} onBlur={inputBlur}
                    required
                  />
                </div>

                <div className="col-span-2 pt-2">
                  <LocationPickerMap
                    pincode={chefForm.pincode}
                    initialLocation={{ latitude: chefForm.latitude, longitude: chefForm.longitude }}
                    onLocationSelect={(lat, lng) => setChefForm(prev => ({ ...prev, latitude: lat, longitude: lng }))}
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full py-3.5 text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save Kitchen Changes'}
          </button>
        </form>
      )}

      {/* 2. DELIVERY PROFILE */}
      {user?.role === 'delivery' && (
        <form onSubmit={handleDeliverySave} className="card-solid p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <FiTruck size={18} style={{ color: '#B4846C' }} />
            <h3 className="text-xs font-extrabold uppercase tracking-wider" style={bodyTextStyle}>Partner Fleet & Licence</h3>
          </div>

          <div className="space-y-3.5">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={labelStyle}>VEHICLE TYPE</span>
              <div className="relative">
                <select
                  value={deliveryForm.vehicle_type}
                  onChange={e => setDeliveryForm(prev => ({ ...prev, vehicle_type: e.target.value }))}
                  className="w-full rounded-xl pl-4 pr-10 py-3 text-xs font-semibold outline-none appearance-none transition-colors"
                  style={inputStyles}
                  onFocus={inputFocus}
                  onBlur={inputBlur}
                >
                  {VEHICLE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" size={14} style={subTextStyle} />
              </div>
            </div>

            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={labelStyle}>DRIVING LICENCE NUMBER</span>
              <input
                type="text"
                value={deliveryForm.licence_number}
                onChange={e => setDeliveryForm(prev => ({ ...prev, licence_number: e.target.value }))}
                placeholder="Enter your licence number"
                className="w-full rounded-xl px-4 py-3 text-xs font-semibold outline-none transition-colors"
                style={inputStyles}
                onFocus={inputFocus}
                onBlur={inputBlur}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full py-3.5 text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save Partner fleet'}
          </button>
        </form>
      )}

      {/* 3. CUSTOMER ADDRESS BOOK */}
      {user?.role === 'customer' && (
        <div className="space-y-4">

          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider" style={labelStyle}>Address Book</span>
            <button
              onClick={() => {
                setEditingAddressId(null);
                setAddressForm({ door_no: '', street: '', area: '', landmark: '', pincode: '', city: '', latitude: null, longitude: null });
                setShowAddressForm(!showAddressForm);
              }}
              className="flex items-center gap-1 font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer shadow-sm transition-colors"
              style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border)', color: '#7D5A50' }}
            >
              <FiPlus size={14} />
              <span>{showAddressForm && !editingAddressId ? 'Close Form' : 'Add Address'}</span>
            </button>
          </div>

          {/* Inline Address Creation/Edition Form */}
          {showAddressForm && (
            <form onSubmit={handleAddressSubmit} className="card-solid p-5 space-y-4 shadow-md" style={{ border: '1px solid #E5B299' }}>
              <h4 className="text-xs font-black uppercase tracking-wider pb-2" style={{ ...headingStyle, borderBottom: '1px solid var(--border)' }}>
                {editingAddressId ? 'Update Saved Address' : 'Add New Delivery Address'}
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <span className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={labelStyle}>DOOR NO / FLAT NO / FLOOR *</span>
                  <input
                    type="text"
                    value={addressForm.door_no}
                    onChange={e => setAddressForm(prev => ({ ...prev, door_no: e.target.value }))}
                    placeholder="e.g. Flat 302, 3rd Floor"
                    className="w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none transition-colors"
                    style={inputStyles}
                    onFocus={inputFocus} onBlur={inputBlur}
                    required
                  />
                </div>

                <div className="col-span-2">
                  <span className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={labelStyle}>STREET ADDRESS *</span>
                  <input
                    type="text"
                    value={addressForm.street}
                    onChange={e => setAddressForm(prev => ({ ...prev, street: e.target.value }))}
                    placeholder="e.g. Park Avenue Road"
                    className="w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none transition-colors"
                    style={inputStyles}
                    onFocus={inputFocus} onBlur={inputBlur}
                    required
                  />
                </div>

                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={labelStyle}>AREA *</span>
                  <input
                    type="text"
                    value={addressForm.area}
                    onChange={e => setAddressForm(prev => ({ ...prev, area: e.target.value }))}
                    placeholder="e.g. Downtown"
                    className="w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none transition-colors"
                    style={inputStyles}
                    onFocus={inputFocus} onBlur={inputBlur}
                    required
                  />
                </div>

                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={labelStyle}>LANDMARK (OPTIONAL)</span>
                  <input
                    type="text"
                    value={addressForm.landmark}
                    onChange={e => setAddressForm(prev => ({ ...prev, landmark: e.target.value }))}
                    placeholder="e.g. Next to Grand Mall"
                    className="w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none transition-colors"
                    style={inputStyles}
                    onFocus={inputFocus} onBlur={inputBlur}
                  />
                </div>

                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={labelStyle}>PINCODE *</span>
                  <input
                    type="text"
                    value={addressForm.pincode}
                    onChange={e => setAddressForm(prev => ({ ...prev, pincode: e.target.value }))}
                    placeholder="e.g. 560001"
                    className="w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none transition-colors"
                    style={inputStyles}
                    onFocus={inputFocus} onBlur={inputBlur}
                    required
                  />
                </div>

                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={labelStyle}>CITY *</span>
                  <input
                    type="text"
                    value={addressForm.city}
                    onChange={e => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="e.g. Bangalore"
                    className="w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none transition-colors"
                    style={inputStyles}
                    onFocus={inputFocus} onBlur={inputBlur}
                    required
                  />
                </div>

                <div className="col-span-2 pt-2">
                  <LocationPickerMap
                    pincode={addressForm.pincode}
                    initialLocation={{ latitude: addressForm.latitude, longitude: addressForm.longitude }}
                    onLocationSelect={(lat, lng) => setAddressForm(prev => ({ ...prev, latitude: lat, longitude: lng }))}
                  />
                </div>
              </div>

              <div className="flex gap-2.5">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-success flex-1 py-3 text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  {saving ? 'Saving...' : editingAddressId ? 'Update' : 'Save Address'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddressForm(false);
                    setEditingAddressId(null);
                  }}
                  className="px-4 py-3 rounded-xl text-xs font-extrabold uppercase transition-colors cursor-pointer"
                  style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-body)' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* LIST OF SAVED ADDRESSES */}
          {addresses.length === 0 ? (
            <div className="card-solid p-8 text-center">
              <span className="text-3xl block mb-2">📍</span>
              <h3 className="text-sm font-bold" style={headingStyle}>No saved addresses found</h3>
              <p className="text-xs mt-1 max-w-[220px] mx-auto" style={subTextStyle}>Please add a primary delivery address to start ordering hot meals!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map(addr => (
                <div
                  key={addr.id}
                  className="card-solid p-4 transition-all relative flex flex-col justify-between gap-3"
                  style={{ borderColor: addr.is_selected ? '#B4846C' : 'var(--border)' }}
                >
                  <div className="pr-12">
                    {/* Primary Badge */}
                    {addr.is_selected && (
                      <span className="text-[8px] font-black uppercase tracking-wider text-white px-2 py-0.5 rounded-md inline-flex items-center gap-0.5 mb-2 shadow-sm"
                        style={{ backgroundColor: '#B4846C' }}>
                        <FiCheck size={10} /> Active Delivery Address
                      </span>
                    )}

                    <div className="flex gap-1.5 text-xs font-extrabold mb-0.5" style={headingStyle}>
                      <FiMapPin size={14} style={{ color: addr.is_selected ? '#B4846C' : 'var(--text-muted)' }} />
                      <span>{addr.door_no}, {addr.street}</span>
                    </div>

                    <p className="text-[11px] font-semibold pl-5 leading-tight" style={subTextStyle}>
                      {addr.area}
                      {addr.landmark && `, Near ${addr.landmark}`}
                      <br />
                      {addr.city} - {addr.pincode}
                    </p>
                  </div>

                  {/* Actions Drawer */}
                  <div className="flex items-center justify-between pt-3.5" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditAddressClick(addr)}
                        className="p-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        style={{ color: 'var(--text-body)', backgroundColor: 'var(--bg-input)' }}
                        title="Edit Address"
                      >
                        <FiEdit2 size={12} />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-rose-600 hover:bg-rose-50 p-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Delete Address"
                      >
                        <FiTrash2 size={12} />
                        <span>Delete</span>
                      </button>
                    </div>

                    {!addr.is_selected && (
                      <button
                        onClick={() => handleSelectAddress(addr.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-black transition-colors cursor-pointer"
                        style={{ color: '#7D5A50', border: '1px solid #E5B299', backgroundColor: 'transparent' }}
                      >
                        Set Active
                      </button>
                    )}
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
