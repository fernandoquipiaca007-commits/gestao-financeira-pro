// Web Push Notification Helper
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log('Service Worker registrado com sucesso:', reg);
      return reg;
    } catch (err) {
      console.warn('Falha ao registrar Service Worker:', err);
    }
  }
  return null;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Este navegador não suporta notificações de trabalho/área de trabalho.');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (e) {
      // Callback approach for older browsers
      return new Promise((resolve) => {
        Notification.requestPermission((permission) => resolve(permission));
      });
    }
  }

  return Notification.permission;
}

export async function sendWebPushNotification(title: string, options?: NotificationOptions): Promise<boolean> {
  if (!('Notification' in window)) return false;

  if (Notification.permission !== 'granted') {
    return false;
  }

  const notificationOptions: NotificationOptions = {
    body: options?.body || '',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: options?.tag || `gestao-push-${Date.now()}`,
    vibrate: [200, 100, 200],
    ...options,
  };

  // Try via Service Worker Registration first
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.active) {
        await reg.showNotification(title, notificationOptions);
        return true;
      }
    } catch (err) {
      console.warn('SW showNotification falhou, tentando fallback:', err);
    }
  }

  // Fallback to standard DOM Notification
  try {
    const notif = new Notification(title, notificationOptions);
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
    return true;
  } catch (err) {
    console.warn('Erro ao disparar Notificação:', err);
    return false;
  }
}

let notificationCheckInterval: any = null;

export function startBackgroundNotificationCheck(checkFn: () => void, intervalMs: number = 60000) {
  if (notificationCheckInterval) clearInterval(notificationCheckInterval);
  checkFn(); // Run immediately
  notificationCheckInterval = setInterval(checkFn, intervalMs);
}
