import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import NetworkError from '../../components/NetworkError';
import { FiSearch, FiTruck, FiCoffee, FiTrendingUp, FiMapPin, FiMic, FiMicOff } from 'react-icons/fi';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useTheme } from '../../context/ThemeContext';
import SEO from '../../components/SEO';

import { notificationService } from '../../services/notificationService';

const CUISINES = ['All', 'Italian', 'Fast Food', 'Burgers', 'Dessert', 'Indian', 'Healthy'];

const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

export default function BrowseRestaurants() {
  const navigate = useNavigate();
  const { isSimpleMode } = useTheme();
  const [restaurants, setRestaurants] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');

  // Voice activated search state
  const [isListening, setIsListening] = useState(false);

  // Geolocation and map state
  const { location, error: geoError } = useGeolocation();
  const [pincode, setPincode] = useState('');
  const [areaName, setAreaName] = useState('');
  const [userCity, setUserCity] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser. Please try Chrome, Edge, or Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setSearchQuery(text);
    };

    recognition.start();
  };


  // Auto-scroll hero banner
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Reverse geocode to get pincode, area name, and city
  useEffect(() => {
    const fetchPincode = async () => {
      if (location.latitude && location.longitude) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}&zoom=18&addressdetails=1`);
          const data = await res.json();
          if (data.address) {
            if (data.address.postcode) setPincode(data.address.postcode);
            const area = data.address.suburb || data.address.neighbourhood || data.address.city_district || data.address.town || data.address.city || '';
            setAreaName(area);
            const city = data.address.city || data.address.town || data.address.county || '';
            setUserCity(city);
          }
        } catch (err) {
          console.error("Failed to reverse geocode:", err);
        }
      }
    };
    fetchPincode();
  }, [location.latitude, location.longitude]);

  const fetchOrders = async () => {
    if (!localStorage.getItem('num_token')) {
      setActiveOrders([]);
      return;
    }
    try {
      const orderData = await api.customer.getOrders();
      const ordersArray = orderData?.data || orderData;
      
      // Send notifications for order status transitions
      notificationService.checkCustomerOrders(ordersArray);

      const viewedRejected = JSON.parse(localStorage.getItem('viewed_rejected_orders') || '[]');

      const active = ordersArray.filter(o => {
        if (o.status === 'delivered' || o.status === 'cancelled') return false;
        if (o.status === 'rejected' && viewedRejected.includes(o.id)) return false;
        return true;
      });
      setActiveOrders(active);
    } catch (err) {
      console.error("Error fetching live orders:", err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const restData = await api.customer.getRestaurants();
      setRestaurants(restData?.data || restData);
      await fetchOrders();
    } catch (err) {
      setError(err.message || 'Unable to fetch restaurants. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(() => { fetchOrders(); }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const handleRetry = () => { fetchData(); };

  const getDeliveryEstimate = (id) => {
    const estimates = ['15-25 min', '20-30 min', '25-35 min', '30-40 min'];
    return estimates[id % estimates.length];
  };

  const filteredRestaurants = restaurants.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase());
    const cuisine = r.cuisine_type || 'Fast Food';
    const matchesCuisine = selectedCuisine === 'All' || cuisine === selectedCuisine;
    const matchesCity = userCity && r.city ? r.city.toLowerCase() === userCity.toLowerCase() : true;
    return matchesSearch && matchesCuisine && matchesCity;
  }).sort((a, b) => {
    const distA = getDistanceFromLatLonInKm(location.latitude, location.longitude, a.latitude, a.longitude);
    const distB = getDistanceFromLatLonInKm(location.latitude, location.longitude, b.latitude, b.longitude);
    return distA - distB;
  });

  if (loading) return <LoadingSpinner message="Finding delicious kitchens nearby..." />;

  if (error) {
    return (
      <div className="py-12">
        <NetworkError message={error} onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8 select-none">
      <SEO title="Browse Delicious Kitchens & Cuisines" description="Explore high-quality home-cooked food options, fresh meal preps, and swift delivery from premium local chefs near you." />

      {/* Dynamic Active Order Tracking Banner */}
      {activeOrders.length > 0 && (
        <div
          onClick={() => navigate(`/customer/orders/${activeOrders[0].id}`)}
          className="text-white p-4 rounded-2xl flex items-center justify-between shadow-md cursor-pointer animate-pulse transition-all"
          style={{ backgroundColor: '#B4846C' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <FiTruck size={20} className="text-white" />
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold tracking-widest" style={{ color: '#FCDEC0' }}>Live Active Order</span>
              <span className="text-sm font-extrabold">
                {activeOrders[0].restaurant?.name || 'Your order'} is {activeOrders[0].status}
              </span>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm" style={{ backgroundColor: '#fff', color: '#7D5A50' }}>
            Track Status
          </span>
        </div>
      )}

      {/* Hero Welcome banner / Promo Slideshow (Hidden in Simple Mode) */}
      {!isSimpleMode && (
        <div className="relative overflow-hidden rounded-2xl shadow-sm h-32">
          {[
            {
              title: "What are you craving today?",
              subtitle: "Order Hot & Fresh",
              desc: "Straight from the chef's kitchen to your front door.",
              icon: <FiCoffee size={120} />,
              bg: '#3e2820',
              text1: '#B4846C',
              text2: '#FCDEC0'
            },
            {
              title: "50% Off First Order!",
              subtitle: "New User Special",
              desc: "Use code NUMNUM50 at checkout to save big.",
              icon: <FiTrendingUp size={120} />,
              bg: '#7D5A50',
              text1: '#FCDEC0',
              text2: '#fff'
            },
            {
              title: "Free Delivery Today",
              subtitle: "Flash Promo",
              desc: "Enjoy zero delivery fees on all orders over ₹500.",
              icon: <FiTruck size={120} />,
              bg: '#B4846C',
              text1: '#fff',
              text2: '#3e2820'
            }
          ].map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 p-5 transition-all duration-700 ease-in-out ${index === currentSlide ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
                }`}
              style={{ backgroundColor: slide.bg, color: slide.text2 }}
            >
              <div className="absolute -right-4 -bottom-4 opacity-10">
                {slide.icon}
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: slide.text1 }}>{slide.subtitle}</span>
              <h2 className="text-xl font-extrabold mt-1 text-white">{slide.title}</h2>
              <p className="text-xs mt-1 max-w-[200px]" style={{ color: slide.text1 }}>{slide.desc}</p>
            </div>
          ))}
          {/* Pagination Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-4 bg-white' : 'w-1.5 bg-white/40'
                  }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Search Input Bar & Voice Mic */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <FiSearch size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <label htmlFor="search-restaurants" className="sr-only">Search kitchens, dishes, cuisines...</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isListening ? "Listening... Speak now 🎙️" : areaName ? `Searching near "${areaName}"` : "Search kitchens, dishes, cuisines..."}
              className="w-full rounded-xl pl-11 pr-4 py-3 shadow-sm transition-all font-medium text-sm outline-none"
              style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-head)' }}
              onFocus={e => e.target.style.borderColor = '#B4846C'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
              id="search-restaurants"
            />
          </div>
          <button
            type="button"
            onClick={startSpeechRecognition}
            className={`flex items-center justify-center rounded-xl border transition-all cursor-pointer ${isListening ? 'animate-pulse text-white bg-rose-600 border-rose-600' : 'bg-panel border text-brand-600'
              }`}
            style={{
              backgroundColor: isListening ? '#e11d48' : 'var(--bg-panel)',
              borderColor: isListening ? '#e11d48' : 'var(--border)',
              color: isListening ? '#ffffff' : '#7D5A50',
              width: '48px',
              height: '48px'
            }}
            title="Search by Voice"
            id="btn-voice-search"
          >
            {isListening ? <FiMicOff size={18} className="text-white" /> : <FiMic size={18} />}
          </button>
        </div>
      </div>


      {/* Cuisine Tag Carousel */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Popular Cuisines</span>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x">
          {CUISINES.map((cuisine) => {
            const isSelected = selectedCuisine === cuisine;
            return (
              <button
                key={cuisine}
                onClick={() => setSelectedCuisine(cuisine)}
                className="snap-center px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                style={isSelected
                  ? { backgroundColor: '#B4846C', color: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
                  : { backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-body)' }
                }
              >
                {cuisine}
              </button>
            );
          })}
        </div>
      </div>

      {/* Restaurant List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            {filteredRestaurants.length} Restaurants Available
          </span>
        </div>

        {filteredRestaurants.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border)' }}>
            <span className="text-3xl block mb-2" style={{ color: 'var(--text-muted)' }}>🍽️</span>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-head)' }}>No restaurants match your search</h3>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Try resetting the cuisine filter or check spelling.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRestaurants.map((restaurant) => {
              const isKitchenOpen = restaurant.is_open;
              const cuisine = restaurant.cuisine_type || 'Fast Food';

              if (isSimpleMode) {
                return (
                  <div
                    key={restaurant.id}
                    onClick={() => {
                      if (restaurant.is_active) {
                        navigate(`/customer/restaurants/${restaurant.id}`);
                      }
                    }}
                    className={`card-solid transition-all cursor-pointer p-5 flex flex-col gap-3 relative border-2 ${!isKitchenOpen ? 'opacity-85' : ''
                      }`}
                    style={{ borderColor: 'var(--border)' }}
                    id={`restaurant-${restaurant.id}`}
                  >
                    <div className="flex justify-between items-center gap-3">
                      <div>
                        <h3 className="font-extrabold text-lg text-brand-700" style={{ color: 'var(--text-head)' }}>
                          {restaurant.name}
                        </h3>
                        <p className="text-sm font-semibold mt-1" style={{ color: 'var(--text-muted)' }}>
                          {cuisine} Cuisine • {getDeliveryEstimate(restaurant.id)} delivery
                        </p>
                      </div>

                      <span className={`text-xs font-black uppercase tracking-wider px-3.5 py-2 rounded-xl text-white shadow-sm whitespace-nowrap ${isKitchenOpen ? 'bg-emerald-600' : 'bg-slate-500'
                        }`}>
                        {isKitchenOpen ? '🟢 OPEN' : '⚪ CLOSED'}
                      </span>
                    </div>

                    <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text-body)' }}>
                      {restaurant.description}
                    </p>

                    <div className="mt-2 flex items-center justify-between p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)' }}>
                      <span className="text-xs font-black uppercase tracking-wider" style={{ color: '#7D5A50' }}>
                        🚚 FREE DELIVERY TODAY
                      </span>
                      <span className="text-xs font-black uppercase tracking-wider" style={{ color: '#B4846C' }}>
                        Tap to View Menu 👉
                      </span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={restaurant.id}
                  onClick={() => {
                    if (restaurant.is_active) {
                      navigate(`/customer/restaurants/${restaurant.id}`);
                    }
                  }}
                  className={`card-solid transition-all cursor-pointer group flex flex-col p-0 overflow-hidden hover:shadow-md relative ${!isKitchenOpen ? 'opacity-85' : ''
                    }`}
                  id={`restaurant-${restaurant.id}`}
                >
                  {/* Banner */}
                  <div className="h-28 relative flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #B4846C, #E5B299)' }}>
                    {restaurant.banner_image ? (
                      <img
                        src={restaurant.banner_image}
                        alt={restaurant.name}
                        className="absolute inset-0 w-full h-full object-cover opacity-80"
                      />
                    ) : (
                      <div className="text-center">
                        <span className="text-white/20 text-5xl font-extrabold select-none tracking-tighter">Num Num</span>
                      </div>
                    )}

                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg text-white shadow-sm ${isKitchenOpen ? 'bg-emerald-600' : 'bg-slate-500'
                        }`}>
                        {isKitchenOpen ? 'Open Now' : 'Closed'}
                      </span>
                    </div>

                    <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm border border-white/20 px-2 py-1 rounded-lg shadow-sm flex items-center gap-1">
                      <FiTruck size={12} style={{ color: '#7D5A50' }} />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: '#3e2820' }}>
                        {getDeliveryEstimate(restaurant.id)}
                      </span>
                    </div>
                  </div>

                  {/* Body details */}
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-extrabold text-base transition-colors" style={{ color: 'var(--text-head)' }}>
                          {restaurant.name}
                        </h3>
                        <p className="text-xs font-medium mt-1 line-clamp-1" style={{ color: 'var(--text-muted)' }}>
                          {restaurant.description}
                        </p>
                      </div>
                    </div>

                    {/* Footer Tags */}
                    <div className="mt-4 pt-3 flex items-center gap-2" style={{ borderTop: '1px solid var(--border)' }}>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg"
                        style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                        {cuisine}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg"
                        style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                        Free Delivery
                      </span>
                    </div>
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
