// Browser/PWA Notification Utility Service

const activeNotifications = new Map();

export const notificationService = {
  // Request user permission for notifications
  requestPermission: async () => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications.');
      return 'denied';
    }
    if (Notification.permission === 'default') {
      return await Notification.requestPermission();
    }
    return Notification.permission;
  },

  // Check if permissions are granted
  hasPermission: () => {
    return 'Notification' in window && Notification.permission === 'granted';
  },

  // Send a browser notification
  send: (id, title, options = {}) => {
    if (!notificationService.hasPermission()) {
      return null;
    }

    // Default configuration
    const defaultOptions = {
      icon: '/logo.jpg',
      badge: '/logo.jpg',
      tag: id ? String(id) : undefined,
      renotify: id ? true : false,
      ...options
    };

    try {
      // Close existing notification with the same ID if exists
      if (id && activeNotifications.has(id)) {
        activeNotifications.get(id).close();
      }

      const notification = new Notification(title, defaultOptions);

      // Save notification to close it later if required
      if (id) {
        activeNotifications.set(id, notification);
        notification.onclose = () => {
          activeNotifications.delete(id);
        };
      }

      return notification;
    } catch (err) {
      console.error('Failed to trigger notification:', err);
      return null;
    }
  },

  // Close a specific notification
  close: (id) => {
    if (activeNotifications.has(id)) {
      activeNotifications.get(id).close();
      activeNotifications.delete(id);
    }
  },

  // Monitor order status changes and notify customer
  checkCustomerOrders: (orders) => {
    if (!orders || !Array.isArray(orders)) return;

    orders.forEach(o => {
      const orderId = o.id;
      const status = o.status;
      const key = `order_status_${orderId}`;
      const lastStatus = localStorage.getItem(key);

      // Only notify if we already had a recorded status and it has changed
      if (lastStatus && lastStatus !== status) {
        let title = '';
        let body = '';

        switch (status) {
          case 'accepted':
            title = 'Order Confirmed! ✅';
            body = `Your order #${orderId} from ${o.restaurant_name || 'Kitchen'} has been accepted.`;
            break;
          case 'preparing':
            title = 'Cooking & Preparing! 🍳';
            body = `Chef is preparing your fresh meal from ${o.restaurant_name || 'Kitchen'}.`;
            break;
          case 'ready':
            title = 'Ready for Pickup! 📦';
            body = `Your food is ready and waiting for delivery partner pickup.`;
            break;
          case 'out_for_delivery':
            title = 'Food Dispatched! 🛵';
            body = `Your order is out for delivery! Share delivery PIN: ${o.delivery_pin || 'N/A'} with the driver.`;
            break;
          case 'delivered':
            title = 'Successfully Delivered! 🎉';
            body = `Enjoy your fresh food from ${o.restaurant_name || 'Kitchen'}!`;
            break;
          default:
            break;
        }

        if (title && body) {
          notificationService.send(`customer-order-${orderId}-${status}`, title, {
            body,
            tag: `customer-order-${orderId}`,
            requireInteraction: status === 'out_for_delivery'
          });
        }
      }

      // Record the current status
      localStorage.setItem(key, status);
    });
  }
};
