const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function stripeAuthHeader() {
  return { Authorization: `Bearer ${STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' };
}

function encodeForm(obj) {
  return Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
}

async function stripeGet(path) {
  const r = await fetch(`https://api.stripe.com${path}`, { headers: stripeAuthHeader() });
  return r.json();
}

async function stripePost(path, body) {
  const r = await fetch(`https://api.stripe.com${path}`, {
    method: 'POST',
    headers: stripeAuthHeader(),
    body: encodeForm(body),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || `Stripe error ${r.status}`);
  return data;
}

async function supabaseUpdate(table, id, updates) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(updates),
  });
  return r.ok;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      projectId,
      incomeId,
      clientEmail,
      clientName,
      clientWhatsapp,
      amount,
      currency,
      description,
      footerText,
      daysUntilDue,
      sendEmailNow,
      companyId,
    } = await req.json();

    if (!clientEmail || !amount || !currency) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios em falta: clientEmail, amount, currency' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Buscar ou criar Customer
    let customerId;
    const search = await stripeGet(`/v1/customers?email=${encodeURIComponent(clientEmail)}&limit=1`);
    if (search.data?.length > 0) {
      customerId = search.data[0].id;
      if (clientName && search.data[0].name !== clientName) {
        await stripePost(`/v1/customers/${customerId}`, { name: clientName });
      }
    } else {
      const customerBody = { email: clientEmail, 'metadata[gestao_project_id]': projectId || '' };
      if (clientName) customerBody.name = clientName;
      if (clientWhatsapp) customerBody.phone = clientWhatsapp;
      const customer = await stripePost('/v1/customers', customerBody);
      customerId = customer.id;
    }

    // 2. Invoice Item
    const amountInCents = Math.round(Number(amount) * 100);
    const stripeCurrency = String(currency).toLowerCase();
    await stripePost('/v1/invoiceitems', {
      customer: customerId,
      amount: amountInCents,
      currency: stripeCurrency,
      description: description || `Servico — ${projectId}`,
    });

    // 3. Invoice
    const invoiceBody = {
      customer: customerId,
      collection_method: 'send_invoice',
      days_until_due: Number(daysUntilDue) || 15,
      'metadata[gestao_project_id]': projectId || '',
      'metadata[gestao_income_id]': incomeId || '',
    };
    if (footerText) invoiceBody.footer = footerText;
    const invoice = await stripePost('/v1/invoices', invoiceBody);

    // 4. Finalizar
    const finalizedInvoice = await stripePost(`/v1/invoices/${invoice.id}/finalize`, {});

    // 5. Enviar email
    let sentInvoice = finalizedInvoice;
    if (sendEmailNow) {
      sentInvoice = await stripePost(`/v1/invoices/${invoice.id}/send`, {});
    }

    // 6. Guardar no Supabase
    if (incomeId) {
      await supabaseUpdate('incomes', incomeId, {
        stripe_invoice_id: sentInvoice.id,
        stripe_customer_id: customerId,
        stripe_invoice_url: sentInvoice.hosted_invoice_url,
        stripe_invoice_pdf: sentInvoice.invoice_pdf,
        stripe_status: sentInvoice.status,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        invoiceId: sentInvoice.id,
        invoiceUrl: sentInvoice.hosted_invoice_url,
        invoicePdf: sentInvoice.invoice_pdf,
        customerId,
        status: sentInvoice.status,
        emailSent: !!sendEmailNow,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const msg = err?.message || 'Erro interno ao criar fatura';
    console.error('[stripe-create-invoice] Error:', msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
