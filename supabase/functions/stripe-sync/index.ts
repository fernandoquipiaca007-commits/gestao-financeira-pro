// Lê a Stripe (só leitura): saldo em euros e, por pagamento, câmbio, taxas e valor líquido.
const STRIPE_API_KEY = Deno.env.get('STRIPE_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

function jwtRole(token: string): string | null {
  try {
    const p = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return p.role ?? null;
  } catch { return null; }
}

// A chave anónima é pública: só passam o service role ou um utilizador com acesso ao financeiro.
async function allowed(token: string): Promise<boolean> {
  const role = jwtRole(token);
  if (role === 'service_role') return true;
  if (role !== 'authenticated') return false;
  const call = (fn: string, body: unknown) =>
    fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((r) => (r.ok ? r.json() : false)).catch(() => false);
  return (await call('is_owner', {})) === true || (await call('has_permission', { p_permission_id: 'financial.view' })) === true;
}

async function stripe(path: string) {
  const r = await fetch(`https://api.stripe.com/v1/${path}`, { headers: { Authorization: `Bearer ${STRIPE_API_KEY}` } });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error?.message || `Stripe ${r.status}`);
  return j;
}

const money = (cents: number) => Math.round(cents) / 100;
const day = (unix: number) => new Date(unix * 1000).toISOString().slice(0, 10);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token || !(await allowed(token))) return json({ error: 'Sem permissão' }, 403);
  if (!STRIPE_API_KEY) return json({ error: 'STRIPE_API_KEY não configurada' }, 500);

  // Modo câmbio: cotação da Stripe (sem a taxa de conversão de 2%) de real e dólar para euro.
  let mode = new URL(req.url).searchParams.get('mode');
  if (!mode && req.method === 'POST') { try { mode = (await req.json())?.mode ?? null; } catch { /* sem corpo */ } }
  if (mode === 'fx') {
    try {
      const body = new URLSearchParams({ to_currency: 'eur', lock_duration: 'none' });
      body.append('from_currencies[]', 'brl');
      body.append('from_currencies[]', 'usd');
      const r = await fetch('https://api.stripe.com/v1/fx_quotes', {
        method: 'POST',
        headers: { Authorization: `Bearer ${STRIPE_API_KEY}`, 'Stripe-Version': '2025-09-30.preview', 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      const q = await r.json();
      if (!r.ok) throw new Error(q?.error?.message || `Stripe ${r.status}`);
      const rate = (c: string) => q.rates?.[c]?.rate_details?.base_rate ?? q.rates?.[c]?.exchange_rate ?? null;
      return json({ source: 'Stripe', date: day(q.created), to: 'EUR', brl: rate('brl'), usd: rate('usd') });
    } catch (e) {
      return json({ error: (e as Error).message }, 502);
    }
  }

  try {
    const bal = await stripe('balance');
    const all: any[] = [];
    let after = '';
    for (let page = 0; page < 20; page++) {
      const r = await stripe(`balance_transactions?limit=100&expand[]=data.source${after ? `&starting_after=${after}` : ''}`);
      all.push(...r.data);
      if (!r.has_more || !r.data.length) break;
      after = r.data[r.data.length - 1].id;
    }
    const transactions = all.map((t: any) => {
      const src = t.source && typeof t.source === 'object' ? t.source : null;
      return {
        id: t.id,
        type: t.type,
        date: day(t.created),
        available_on: day(t.available_on),
        status: t.status,
        currency: t.currency.toUpperCase(),
        amount: money(t.amount),
        fee: money(t.fee),
        net: money(t.net),
        // Stripe: 1 unidade da moeda original = exchange_rate na moeda do saldo
        exchange_rate: t.exchange_rate,
        original_amount: src?.amount != null ? money(src.amount) : null,
        original_currency: src?.currency ? String(src.currency).toUpperCase() : null,
        payer: src?.billing_details?.name || src?.billing_details?.email || null,
        description: t.description || src?.description || null,
        fee_details: (t.fee_details || []).map((f: any) => ({ type: f.type, description: f.description, amount: money(f.amount) })),
      };
    });
    return json({
      checked_at: new Date().toISOString(),
      balance: {
        available: bal.available.map((b: any) => ({ currency: b.currency.toUpperCase(), amount: money(b.amount) })),
        pending: bal.pending.map((b: any) => ({ currency: b.currency.toUpperCase(), amount: money(b.amount) })),
      },
      transactions,
    });
  } catch (e) {
    return json({ error: (e as Error).message }, 502);
  }
});
