import Stripe from 'npm:stripe@14';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      amount,           // valor em reais (ex: 600.00)
      currency,         // 'BRL' | 'USD' | 'EUR'
      description,      // descrição do serviço (item da fatura)
      footerText,       // rodapé da fatura
      daysUntilDue,     // 7 | 15 | 30 | 45 | 60
      sendEmailNow,     // boolean — envia email automaticamente via Stripe?
      companyId,
    } = await req.json();

    // Validação básica
    if (!clientEmail || !amount || !currency) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios em falta: clientEmail, amount, currency' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Buscar ou criar Customer no Stripe
    let customerId: string;
    const existingCustomers = await stripe.customers.list({ email: clientEmail, limit: 1 });

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
      // Actualizar nome se necessário
      if (clientName && existingCustomers.data[0].name !== clientName) {
        await stripe.customers.update(customerId, { name: clientName });
      }
    } else {
      const customer = await stripe.customers.create({
        email: clientEmail,
        name: clientName || clientEmail,
        phone: clientWhatsapp || undefined,
        metadata: {
          gestao_project_id: projectId || '',
          gestao_company_id: companyId || '',
        },
      });
      customerId = customer.id;
    }

    // 2. Converter valor para centavos (Stripe usa centavos)
    const amountInCents = Math.round(Number(amount) * 100);
    const stripeCurrency = currency.toLowerCase(); // 'brl', 'usd', 'eur'

    // 3. Criar Invoice Item
    await stripe.invoiceItems.create({
      customer: customerId,
      amount: amountInCents,
      currency: stripeCurrency,
      description: description || `Serviço — ${projectId}`,
    });

    // 4. Criar Invoice
    const invoice = await stripe.invoices.create({
      customer: customerId,
      collection_method: 'send_invoice',
      days_until_due: Number(daysUntilDue) || 15,
      footer: footerText || '',
      metadata: {
        gestao_project_id: projectId || '',
        gestao_income_id: incomeId || '',
        gestao_company_id: companyId || '',
      },
    });

    // 5. Finalizar a fatura (necessário antes de enviar ou obter PDF)
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

    // 6. Enviar por email via Stripe se solicitado
    let sentInvoice = finalizedInvoice;
    if (sendEmailNow) {
      sentInvoice = await stripe.invoices.sendInvoice(invoice.id);
    }

    // 7. Guardar stripe_invoice_id e URLs na tabela incomes do Supabase
    if (incomeId) {
      await supabase
        .from('incomes')
        .update({
          stripe_invoice_id: sentInvoice.id,
          stripe_customer_id: customerId,
          stripe_invoice_url: sentInvoice.hosted_invoice_url,
          stripe_invoice_pdf: sentInvoice.invoice_pdf,
          stripe_status: sentInvoice.status,
        })
        .eq('id', incomeId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        invoiceId: sentInvoice.id,
        invoiceUrl: sentInvoice.hosted_invoice_url,
        invoicePdf: sentInvoice.invoice_pdf,
        customerId,
        status: sentInvoice.status,
        emailSent: sendEmailNow ?? false,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[stripe-create-invoice] Error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Erro interno ao criar fatura' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
