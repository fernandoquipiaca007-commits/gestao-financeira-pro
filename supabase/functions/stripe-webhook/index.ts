import Stripe from 'npm:stripe@14';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req) => {
  // O Stripe envia o body como raw bytes — NÃO usar req.json()
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') ?? '';
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('[stripe-webhook] Invalid signature:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log(`[stripe-webhook] Event: ${event.type}`);

  try {
    if (event.type === 'invoice.paid') {
      const invoice = event.data.object as Stripe.Invoice;
      const gestaoIncomeId = invoice.metadata?.gestao_income_id;
      const gestaoProjectId = invoice.metadata?.gestao_project_id;

      // Obter URL do recibo (do charge)
      let receiptUrl: string | null = null;
      if (invoice.charge && typeof invoice.charge === 'string') {
        try {
          const charge = await stripe.charges.retrieve(invoice.charge);
          receiptUrl = charge.receipt_url ?? null;
        } catch {}
      }

      // Actualizar a receita no Supabase
      if (gestaoIncomeId) {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const { error } = await supabase
          .from('incomes')
          .update({
            status: 'Recebido',
            received_date: today,
            stripe_status: 'paid',
            stripe_receipt_url: receiptUrl,
            stripe_invoice_pdf: invoice.invoice_pdf,
            stripe_invoice_url: invoice.hosted_invoice_url,
          })
          .eq('id', gestaoIncomeId);

        if (error) {
          console.error('[stripe-webhook] Failed to update income:', error);
        } else {
          console.log(`[stripe-webhook] Income ${gestaoIncomeId} marked as Recebido`);
        }
      }

      // Actualizar paid_amount no projecto
      if (gestaoProjectId && invoice.amount_paid) {
        const paidAmount = invoice.amount_paid / 100; // converter de centavos para reais

        // Buscar o projecto actual
        const { data: project } = await supabase
          .from('projects')
          .select('paid_amount, total_amount')
          .eq('id', gestaoProjectId)
          .single();

        if (project) {
          const newPaidAmount = (project.paid_amount || 0) + paidAmount;
          const isFullyPaid = newPaidAmount >= project.total_amount && project.total_amount > 0;

          await supabase
            .from('projects')
            .update({
              paid_amount: newPaidAmount,
              status: isFullyPaid ? 'Concluído' : undefined,
            })
            .eq('id', gestaoProjectId);

          console.log(`[stripe-webhook] Project ${gestaoProjectId} paid_amount updated to ${newPaidAmount}`);
        }
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice;
      const gestaoIncomeId = invoice.metadata?.gestao_income_id;

      if (gestaoIncomeId) {
        await supabase
          .from('incomes')
          .update({
            status: 'Atrasado',
            stripe_status: invoice.status ?? 'open',
          })
          .eq('id', gestaoIncomeId);

        console.log(`[stripe-webhook] Income ${gestaoIncomeId} marked as Atrasado (payment failed)`);
      }
    }

    if (event.type === 'invoice.voided') {
      const invoice = event.data.object as Stripe.Invoice;
      const gestaoIncomeId = invoice.metadata?.gestao_income_id;

      if (gestaoIncomeId) {
        await supabase
          .from('incomes')
          .update({ stripe_status: 'void' })
          .eq('id', gestaoIncomeId);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[stripe-webhook] Processing error:', err);
    return new Response(`Server Error: ${err.message}`, { status: 500 });
  }
});
