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
    // 1. Dispatch custom event for visual in-app toast notification alert
    const toastEvent = new CustomEvent('num_toast', {
      detail: {
        id,
        title,
        body: options.body || '',
        icon: options.icon || '/logo.jpg',
        requireInteraction: options.requireInteraction || false
      }
    });
    window.dispatchEvent(toastEvent);

    // Play chime sound
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 chime
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn('Audio synthesis chime blocked or not supported', e);
    }

    // 2. Try to trigger a system push notification
    if (!notificationService.hasPermission()) {
      return null;
    }

    const defaultOptions = {
      icon: '/logo.jpg',
      badge: '/logo.jpg',
      tag: id ? String(id) : undefined,
      renotify: id ? true : false,
      ...options
    };

    // Try service worker first (crucial for mobile browser/PWA support)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, defaultOptions);
      }).catch(err => {
        console.warn('Service Worker notification failed, trying native Notification:', err);
        try {
          const notification = new Notification(title, defaultOptions);
          if (id) activeNotifications.set(id, notification);
        } catch (e) {
          console.error('Notification constructor failed:', e);
        }
      });
    } else {
      try {
        if (id && activeNotifications.has(id)) {
          activeNotifications.get(id).close();
        }
        const notification = new Notification(title, defaultOptions);
        if (id) {
          activeNotifications.set(id, notification);
          notification.onclose = () => {
            activeNotifications.delete(id);
          };
        }
        return notification;
      } catch (err) {
        console.error('Failed to trigger standard notification:', err);
      }
    }
    return null;
  },

  // Close a specific notification
  close: (id) => {
    // Dispatch close event for in-app toast
    window.dispatchEvent(new CustomEvent('num_toast_close', { detail: { id } }));

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
