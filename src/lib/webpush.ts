// Web Push Notification Helper
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log('Service Worker registered successfully:', reg);
      return reg;
    } catch (err) {
      console.warn('Service Worker registration failed:', err);
    }
  }
  return null;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

export async function sendWebPushNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    // If Service Worker is registered, use SW notification for better persistence
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        reg.showNotification(title, {
          body: options?.body || '',
          icon: '/assets/icon.png',
          tag: options?.tag || 'gestao-push',
          vibrate: [200, 100, 200],
          ...options,
        });
        return;
      } catch {
        // Fallback to standard Notification
      }
    }

    new Notification(title, {
      body: options?.body || '',
      icon: '/assets/icon.png',
      ...options,
    });
  }
}

let notificationCheckInterval: any = null;

export function startBackgroundNotificationCheck(checkFn: () => void, intervalMs: number = 60000) {
  if (notificationCheckInterval) clearInterval(notificationCheckInterval);
  checkFn(); // Run immediately
  notificationCheckInterval = setInterval(checkFn, intervalMs);
}
