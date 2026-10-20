import { supabase } from './supabase';

// chave pública VAPID (a privada está só nos segredos do Supabase)
const VAPID_PUBLIC_KEY = (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined)
  || 'BMm1nj3Nt425ODngMkfMszBUuPEfWaDvBLzNiONe6JgTI_OV3JFqAWE602Mz7bYrRHoh0b_NFDcK3PmIC_5LpRU';

const toKey = (b64: string) => {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

export const pushSupported = () => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

// regista este browser para receber notificações do suporte; chamar a partir de um clique do utilizador
export async function enablePush(app: 'manager' | 'admin'): Promise<'granted' | 'denied' | 'unsupported' | 'error'> {
  if (!pushSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return 'denied';
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    const sub = (await reg.pushManager.getSubscription())
      ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(VAPID_PUBLIC_KEY) }));
    const j = sub.toJSON();
    const { error } = await supabase.rpc('save_push_subscription', {
      p_app: app, p_endpoint: j.endpoint, p_p256dh: j.keys?.p256dh, p_auth: j.keys?.auth, p_user_agent: navigator.userAgent,
    });
    return error ? 'error' : 'granted';
  } catch {
    return 'error';
  }
}

// pede à função support-push que avise o outro lado desta mensagem
export function notifySupport(messageId: string) {
  supabase.functions.invoke('support-push', { body: { message_id: messageId } }).catch(() => {});
}
