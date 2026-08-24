// Edge Function: create-user
// Cria um utilizador no Supabase Auth usando a Service Role Key (Admin API)
// sem afectar a sessão do owner que está a chamar esta função.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Verificar que o chamador tem sessão válida
  const authHeader = req.headers.get('authorization') ?? '';
  const callerToken = authHeader.replace('Bearer ', '').trim();

  if (!callerToken) {
    return new Response(JSON.stringify({ success: false, error: 'Sessão inválida' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Validar o token do chamador usando o ANON_KEY como apikey
  const callerRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${callerToken}`,
    },
  });

  if (!callerRes.ok) {
    return new Response(JSON.stringify({ success: false, error: 'Sessão expirada. Faça login novamente.' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { email, password, name, role, companyId } = await req.json();

    if (!email || !password || !name || !role || !companyId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Campos obrigatórios em falta: email, password, name, role, companyId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Criar utilizador via Admin API (não afecta a sessão do owner)
    const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { name },
      }),
    });

    const userData = await createRes.json();

    if (!createRes.ok || !userData.id) {
      const errMsg = userData?.message || userData?.msg || `Erro ${createRes.status} ao criar utilizador`;
      throw new Error(errMsg);
    }

    const userId = userData.id;

    // 2. Inserir perfil em user_profiles
    const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        id: userId,
        company_id: companyId,
        email,
        name,
        role,
        status: 'active',
        must_change_password: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    });

    if (!profileRes.ok) {
      const errTxt = await profileRes.text();
      console.error('[create-user] Profile insert failed:', errTxt);
      // Ainda retornamos sucesso pois o utilizador Auth foi criado
      // O perfil pode ser criado no primeiro login
    }

    return new Response(
      JSON.stringify({ success: true, userId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    const msg = err?.message || 'Erro ao criar utilizador';
    console.error('[create-user] Error:', msg);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
