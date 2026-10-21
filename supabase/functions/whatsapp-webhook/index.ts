// Edge Function: whatsapp-webhook — SÓ LEITURA.
// Recebe da API oficial do WhatsApp (Meta) as mensagens que chegam e, em modo coexistência,
// as que o Fernando envia pela app do telemóvel (smb_message_echoes), e guarda-as em
// whatsapp_messages. Esta função NUNCA envia, responde ou marca mensagens como lidas:
// não existe aqui nenhuma chamada à API de envio da Meta.
//
// Segredos (Supabase → Edge Functions → Secrets):
//   WHATSAPP_APP_SECRET   — App Secret da app Meta (valida a assinatura de cada pedido)
//   WHATSAPP_VERIFY_TOKEN — texto à escolha, o mesmo que se escreve na Meta ao ligar o webhook
//   WHATSAPP_COMPANY_ID   — (opcional) empresa no sistema; por defeito a CodeEngine
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já existem no ambiente das funções.

const COMPANY_ID = Deno.env.get('WHATSAPP_COMPANY_ID') || 'c2e9b396-d7db-41fb-a1e7-bb87c65b4733';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const digits = (s: string) => (s || '').replace(/\D/g, '');

async function validSignature(raw: string, header: string | null): Promise<boolean> {
  const secret = Deno.env.get('WHATSAPP_APP_SECRET');
  if (!secret || !header?.startsWith('sha256=')) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(raw)));
  const hex = Array.from(mac).map((b) => b.toString(16).padStart(2, '0')).join('');
  const expected = header.slice(7);
  if (expected.length !== hex.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

function textOf(m: any): string {
  switch (m.type) {
    case 'text': return m.text?.body || '';
    case 'button': return m.button?.text || '';
    case 'interactive': return m.interactive?.button_reply?.title || m.interactive?.list_reply?.title || '';
    case 'image': case 'video': case 'document': return m[m.type]?.caption || `[${m.type}]`;
    case 'audio': return '[áudio]';
    case 'location': return `[localização] ${m.location?.name || ''}`.trim();
    default: return `[${m.type}]`;
  }
}

async function rest(path: string, init: RequestInit = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // Ligação do webhook na Meta (verificação inicial).
  if (req.method === 'GET') {
    const ok = url.searchParams.get('hub.mode') === 'subscribe' && url.searchParams.get('hub.verify_token') === Deno.env.get('WHATSAPP_VERIFY_TOKEN');
    return ok ? new Response(url.searchParams.get('hub.challenge') || '', { status: 200 }) : new Response('forbidden', { status: 403 });
  }
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });

  const raw = await req.text();
  if (!(await validSignature(raw, req.headers.get('x-hub-signature-256')))) return new Response('invalid signature', { status: 401 });

  let payload: any;
  try { payload = JSON.parse(raw); } catch { return new Response('bad json', { status: 400 }); }

  // Clientes da empresa, para ligar cada número à ficha certa (últimos 9 dígitos).
  const clientsRes = await rest(`clients?company_id=eq.${COMPANY_ID}&select=id,whatsapp`);
  const clients: { id: string; whatsapp: string | null }[] = clientsRes.ok ? await clientsRes.json() : [];
  const clientFor = (phone: string) => {
    const tail = digits(phone).slice(-9);
    return tail.length >= 8 ? clients.find((c) => digits(c.whatsapp || '').endsWith(tail))?.id || null : null;
  };

  const rows: Record<string, unknown>[] = [];
  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      const v = change.value || {};
      const names = new Map<string, string>((v.contacts || []).map((c: any) => [c.wa_id, c.profile?.name || '']));
      // Mensagens recebidas das clientes.
      for (const m of v.messages || []) {
        rows.push({ id: m.id, company_id: COMPANY_ID, contact_phone: digits(m.from), contact_name: names.get(m.from) || null, direction: 'in', message_type: m.type, body: textOf(m), sent_at: new Date(Number(m.timestamp) * 1000).toISOString(), client_id: clientFor(m.from), raw: m });
      }
      // Coexistência: mensagens que o Fernando enviou pela app (só registo, nunca envio).
      for (const m of v.message_echoes || []) {
        rows.push({ id: m.id, company_id: COMPANY_ID, contact_phone: digits(m.to), contact_name: null, direction: 'out', message_type: m.type, body: textOf(m), sent_at: new Date(Number(m.timestamp) * 1000).toISOString(), client_id: clientFor(m.to), raw: m });
      }
    }
  }

  if (rows.length > 0) {
    const ins = await rest('whatsapp_messages', { method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' }, body: JSON.stringify(rows) });
    if (!ins.ok) console.error('[whatsapp-webhook] insert failed', ins.status, await ins.text());
  }
  // A Meta só precisa de um 200 rápido; estados de entrega e outros eventos são ignorados.
  return new Response('ok', { status: 200 });
});
