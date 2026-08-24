const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

async function verifyStripeSignature(payload, header, secret) {
  try {
    const parts = {};
    for (const part of header.split(',')) {
      const idx = part.indexOf('=');
      if (idx > 0) parts[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
    }
    const timestamp = parts['t'];
    const sig = parts['v1'];
    if (!timestamp || !sig) return false;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const buf = await crypto.subtle.sign('HMAC', key, enc.encode(`${timestamp}.${payload}`));
    const computed = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    return computed === sig;
  } catch { return false; }
}

async function supabaseGet(table, query) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
  });
  return r.json();
}

async function supabaseUpdate(table, id, updates) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(updates),
  });
  return r.ok;
}

async function stripeGet(path) {
  const r = await fetch(`https://api.stripe.com${path}`, {
    headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
  });
  return r.json();
}

Deno.serve(async (req) => {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') ?? '';

  const valid = await verifyStripeSignature(body, signature, STRIPE_WEBHOOK_SECRET);
  if (!valid) {
    console.error('[stripe-webhook] Invalid signature');
    return new Response('Webhook Error: Invalid signature', { status: 400 });
  }

  let event;
  try { event = JSON.parse(body); }
  catch { return new Response('Invalid JSON', { status: 400 }); }

  console.log(`[stripe-webhook] Event: ${event.type}`);

  try {
    if (event.type === 'invoice.paid') {
      const invoice = event.data.object;
      const meta = invoice.metadata ?? {};
      const gestaoIncomeId = meta.gestao_income_id;
      const gestaoProjectId = meta.gestao_project_id;

      let receiptUrl = null;
      if (typeof invoice.charge === 'string' && invoice.charge) {
        try {
          const charge = await stripeGet(`/v1/charges/${invoice.charge}`);
          receiptUrl = charge.receipt_url ?? null;
        } catch { /* ignore */ }
      }

      if (gestaoIncomeId) {
        const today = new Date().toISOString().split('T')[0];
        const ok = await supabaseUpdate('incomes', gestaoIncomeId, {
          status: 'Recebido',
          received_date: today,
          stripe_status: 'paid',
          stripe_receipt_url: receiptUrl,
          stripe_invoice_pdf: invoice.invoice_pdf,
          stripe_invoice_url: invoice.hosted_invoice_url,
        });
        console.log(`[stripe-webhook] Income ${gestaoIncomeId} updated: ${ok}`);
      }

      if (gestaoProjectId && typeof invoice.amount_paid === 'number' && invoice.amount_paid > 0) {
        const paidAmount = invoice.amount_paid / 100;
        const rows = await supabaseGet('projects', `id=eq.${gestaoProjectId}&select=paid_amount,total_amount`);
        if (rows?.[0]) {
          const project = rows[0];
          const newPaid = (project.paid_amount || 0) + paidAmount;
          const isFullyPaid = newPaid >= project.total_amount && project.total_amount > 0;
          await supabaseUpdate('projects', gestaoProjectId, {
            paid_amount: newPaid,
            ...(isFullyPaid ? { status: 'Concluído' } : {}),
          });
        }
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const id = event.data.object?.metadata?.gestao_income_id;
      if (id) await supabaseUpdate('incomes', id, { stripe_status: 'payment_failed' });
    }

    if (event.type === 'invoice.voided') {
      const id = event.data.object?.metadata?.gestao_income_id;
      if (id) await supabaseUpdate('incomes', id, { stripe_status: 'void' });
    }

    return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    const msg = err?.message || 'Erro interno';
    console.error('[stripe-webhook] Error:', msg);
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
});
