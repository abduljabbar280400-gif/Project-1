import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import SplashScreen from './components/SplashScreen';
import Login from './pages/Login';
import Register from './pages/Register';
import MobileLayout from './layouts/MobileLayout';
import Profile from './pages/Profile';

// Customer Pages
import BrowseRestaurants from './pages/customer/BrowseRestaurants';
import RestaurantMenu from './pages/customer/RestaurantMenu';
import CartPage from './pages/customer/CartPage';
import OrderTracking from './pages/customer/OrderTracking';
import CustomerOrders from './pages/customer/CustomerOrders';

// Chef Pages
import ChefDashboard from './pages/chef/ChefDashboard';
import MenuManagement from './pages/chef/MenuManagement';
import ChefPayouts from './pages/chef/ChefPayouts';

// Delivery Pages
import DeliveryDashboard from './pages/delivery/DeliveryDashboard';
import DriverPayouts from './pages/delivery/DriverPayouts';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';

// Route protection wrapper checking local storage token
function RequireAuth({ children, allowedRole }) {
  const token = localStorage.getItem('num_token');
  const userStr = localStorage.getItem('num_user');
  const location = useLocation();

  if (!token || !userStr) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const user = JSON.parse(userStr);

  if (allowedRole && user.role !== allowedRole) {
    // Role mismatch gatekeeper
    if (user.role === 'customer') return <Navigate to="/" replace />;
    if (user.role === 'chef') return <Navigate to="/chef/kitchen" replace />;
    if (user.role === 'delivery') return <Navigate to="/delivery/jobs" replace />;
    if (user.role === 'admin') return <Navigate to="/admin/restaurants" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Redirect home route depending on auth status
function HomeRedirect() {
  const token = localStorage.getItem('num_token');
  const userStr = localStorage.getItem('num_user');

  if (!token || !userStr) {
    return (
      <MobileLayout role="guest">
        <BrowseRestaurants />
      </MobileLayout>
    );
  }

  const user = JSON.parse(userStr);
  if (user.role === 'customer') {
    return (
      <MobileLayout role="customer">
        <BrowseRestaurants />
      </MobileLayout>
    );
  }
  if (user.role === 'chef') return <Navigate to="/chef/kitchen" replace />;
  if (user.role === 'delivery') return <Navigate to="/delivery/jobs" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/restaurants" replace />;

  return (
    <MobileLayout role="guest">
      <BrowseRestaurants />
    </MobileLayout>
  );
}

// Public wrapper for Restaurant Menu
function RestaurantMenuWrapper() {
  const token = localStorage.getItem('num_token');
  const userStr = localStorage.getItem('num_user');
  let role = 'guest';

  if (token && userStr) {
    const user = JSON.parse(userStr);
    if (user.role === 'customer') {
      role = 'customer';
    }
  }

  return (
    <MobileLayout role={role}>
      <RestaurantMenu />
    </MobileLayout>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = React.useState(true);

  return (
    <ThemeProvider>
      {showSplash ? (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      ) : (
        <BrowserRouter>
        <Routes>
          {/* Public auth pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Customer Protected Pages */}
          <Route path="/customer/browse" element={
            <Navigate to="/" replace />
          } />
          <Route path="/customer/restaurants/:restaurantId" element={
            <RestaurantMenuWrapper />
          } />
          <Route path="/customer/cart" element={
            <RequireAuth allowedRole="customer">
              <MobileLayout role="customer">
                <CartPage />
              </MobileLayout>
            </RequireAuth>
          } />
          <Route path="/customer/orders" element={
            <RequireAuth allowedRole="customer">
              <MobileLayout role="customer">
                <CustomerOrders />
              </MobileLayout>
            </RequireAuth>
          } />
          <Route path="/customer/orders/:orderId" element={
            <RequireAuth allowedRole="customer">
              <MobileLayout role="customer">
                <OrderTracking />
              </MobileLayout>
            </RequireAuth>
          } />

          {/* Chef Protected Pages */}
          <Route path="/chef/kitchen" element={
            <RequireAuth allowedRole="chef">
              <MobileLayout role="chef">
                <ChefDashboard />
              </MobileLayout>
            </RequireAuth>
          } />
          <Route path="/chef/menu" element={
            <RequireAuth allowedRole="chef">
              <MobileLayout role="chef">
                <MenuManagement />
              </MobileLayout>
            </RequireAuth>
          } />
          <Route path="/chef/earnings" element={
            <RequireAuth allowedRole="chef">
              <MobileLayout role="chef">
                <ChefPayouts />
              </MobileLayout>
            </RequireAuth>
          } />

          {/* Delivery Protected Pages */}
          <Route path="/delivery/jobs" element={
            <RequireAuth allowedRole="delivery">
              <MobileLayout role="delivery">
                <DeliveryDashboard />
              </MobileLayout>
            </RequireAuth>
          } />
          <Route path="/delivery/active" element={
            <RequireAuth allowedRole="delivery">
              <MobileLayout role="delivery">
                <DeliveryDashboard />
              </MobileLayout>
            </RequireAuth>
          } />
          <Route path="/delivery/earnings" element={
            <RequireAuth allowedRole="delivery">
              <MobileLayout role="delivery">
                <DriverPayouts />
              </MobileLayout>
            </RequireAuth>
          } />

          {/* Admin Protected Pages */}
          <Route path="/admin/restaurants" element={
            <RequireAuth allowedRole="admin">
              <MobileLayout role="admin">
                <AdminDashboard />
              </MobileLayout>
            </RequireAuth>
          } />
          <Route path="/admin/payouts" element={
            <RequireAuth allowedRole="admin">
              <MobileLayout role="admin">
                <AdminDashboard />
              </MobileLayout>
            </RequireAuth>
          } />

          {/* Unified Profile Route */}
          <Route path="/profile" element={
            <RequireAuth>
              <MobileLayout role={JSON.parse(localStorage.getItem('num_user') || '{}').role}>
                <Profile />
              </MobileLayout>
            </RequireAuth>
          } />

          {/* Home redirects */}
          <Route path="/" element={<HomeRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </BrowserRouter>
      )}
    </ThemeProvider>
  );
}
