// Chamada leve a uma função do Supabase (PostgREST) sem carregar o supabase-js inteiro.
// Usada no caminho do quiz, onde cada KB conta no tempo de carregamento no telemóvel.
const URL_ = import.meta.env.VITE_SUPABASE_URL as string;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// token da sessão do Supabase guardado pelo supabase-js (sb-<projeto>-auth-token), se existir
export function sessionToken(): string | null {
  try {
    const k = Object.keys(localStorage).find((x) => x.startsWith('sb-') && x.endsWith('-auth-token'));
    return k ? (JSON.parse(localStorage.getItem(k) || '{}').access_token ?? null) : null;
  } catch { return null; }
}

export const rpcUrl = (fn: string) => `${URL_}/rest/v1/rpc/${fn}`;
export const rpcHeaders = () => ({ apikey: ANON, Authorization: `Bearer ${sessionToken() ?? ANON}`, 'Content-Type': 'application/json' });

export async function restRpc<T = unknown>(fn: string, body: Record<string, unknown>, keepalive = false): Promise<{ data: T | null; error: string | null }> {
  try {
    const r = await fetch(rpcUrl(fn), { method: 'POST', keepalive, headers: rpcHeaders(), body: JSON.stringify(body) });
    const j = await r.json().catch(() => null);
    return r.ok ? { data: j as T, error: null } : { data: null, error: (j && (j.message || j.code)) || `HTTP ${r.status}` };
  } catch (e) {
    return { data: null, error: (e as Error).message };
  }
}
