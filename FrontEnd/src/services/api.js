import axios from 'axios';

// Central API configuration targeting local backend dev port 8000
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Auto-inject Sanctum auth token from localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('num_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Auto-catch 401 unauthenticated errors to trigger redirect/cleanup
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('num_token');
      localStorage.removeItem('num_user');
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register') && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  // 1. Auth endpoints
  auth: {
    register: (data) => apiClient.post('/register', data).then(res => res.data),
    login: (credentials) => apiClient.post('/login', credentials).then(res => res.data),
    profile: () => apiClient.get('/profile').then(res => res.data),
    logout: () => apiClient.post('/logout').then(res => res.data),
    updateProfilePhoto: (data) => apiClient.put('/profile/photo', data).then(res => res.data),
  },

  // 2. Customer endpoints
  customer: {
    getRestaurants: () => apiClient.get('/customer/restaurants').then(res => res.data),
    getRestaurantMenu: (restaurantId) => apiClient.get(`/customer/restaurants/${restaurantId}/menu`).then(res => res.data),
    placeOrder: (orderData) => apiClient.post('/customer/orders', orderData).then(res => res.data),
    getOrders: () => apiClient.get('/customer/orders').then(res => res.data),
    trackOrder: (orderId) => apiClient.get(`/customer/orders/${orderId}`).then(res => res.data),
    cancelOrder: (orderId) => apiClient.post(`/customer/orders/${orderId}/cancel`).then(res => res.data),
    addExtraItems: (orderId, data) => apiClient.post(`/customer/orders/${orderId}/add-items`, data).then(res => res.data),
    getAddresses: () => apiClient.get('/customer/addresses').then(res => res.data),
    addAddress: (data) => apiClient.post('/customer/addresses', data).then(res => res.data),
    updateAddress: (id, data) => apiClient.put(`/customer/addresses/${id}`, data).then(res => res.data),
    deleteAddress: (id) => apiClient.delete(`/customer/addresses/${id}`).then(res => res.data),
    selectAddress: (id) => apiClient.post(`/customer/addresses/${id}/select`).then(res => res.data),
  },

  // 3. Chef endpoints
  chef: {
    getProfile: () => apiClient.get('/chef/profile').then(res => res.data),
    updateProfile: (data) => apiClient.put('/chef/profile', data).then(res => res.data),
    toggleOpen: () => apiClient.post('/chef/profile/toggle-open').then(res => res.data),
    getOrders: () => apiClient.get('/chef/orders').then(res => res.data),
    updateOrderStatus: (orderId, action, rejectionReason = '') => 
      apiClient.post(`/chef/orders/${orderId}/status`, { action, rejection_reason: rejectionReason }).then(res => res.data),
    updateExtraItemsStatus: (orderId, action, rejectionReason = '') =>
      apiClient.post(`/chef/orders/${orderId}/extra-items/status`, { action, rejection_reason: rejectionReason }).then(res => res.data),
    getMenu: () => apiClient.get('/chef/menu').then(res => res.data),
    storeMenuItem: (data) => apiClient.post('/chef/menu', data).then(res => res.data),
    updateMenuItem: (itemId, data) => apiClient.put(`/chef/menu/${itemId}`, data).then(res => res.data),
    destroyMenuItem: (itemId) => apiClient.delete(`/chef/menu/${itemId}`).then(res => res.data),
    getPayouts: () => apiClient.get('/chef/payouts').then(res => res.data),
    requestPayout: (data) => apiClient.post('/chef/payouts', data).then(res => res.data),
  },

  // 4. Delivery Partner endpoints
  delivery: {
    getProfile: () => apiClient.get('/delivery/profile').then(res => res.data),
    updateProfile: (data) => apiClient.put('/delivery/profile', data).then(res => res.data),
    toggleAvailability: () => apiClient.post('/delivery/profile/toggle-availability').then(res => res.data),
    getJobs: () => apiClient.get('/delivery/jobs').then(res => res.data),
    getOrders: () => apiClient.get('/delivery/orders').then(res => res.data),
    acceptJob: (orderId) => apiClient.post(`/delivery/orders/${orderId}/accept`).then(res => res.data),
    pickup: (orderId) => apiClient.post(`/delivery/orders/${orderId}/pickup`).then(res => res.data),
    deliver: (orderId, pin) => apiClient.post(`/delivery/orders/${orderId}/deliver`, { pin }).then(res => res.data),
    getPayouts: () => apiClient.get('/delivery/payouts').then(res => res.data),
    requestPayout: (data) => apiClient.post('/delivery/payouts', data).then(res => res.data),
  },

  // 5. Admin endpoints
  admin: {
    getRestaurants: () => apiClient.get('/admin/restaurants').then(res => res.data),
    toggleActive: (restaurantId) => apiClient.post(`/admin/restaurants/${restaurantId}/toggle-active`).then(res => res.data),
    getOrders: () => apiClient.get('/admin/orders').then(res => res.data),
    getPayouts: () => apiClient.get('/admin/payouts').then(res => res.data),
    processPayout: (payoutId) => apiClient.post(`/admin/payouts/${payoutId}/process`).then(res => res.data),
  }
};

export default apiClient;
