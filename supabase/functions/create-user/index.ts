// Edge Function: create-user
// Cria um utilizador no Supabase Auth usando a Service Role Key (admin API)
// e regista o seu perfil na tabela user_profiles — sem afectar a sessão do owner.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sbAdmin(path, method = 'GET', body?) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/admin${path}`, {
    method,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.message || data?.msg || `Auth Admin error ${r.status}`);
  return data;
}

async function sbDb(path, method = 'GET', body?) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`DB error ${r.status}: ${txt}`);
  }
  if (method === 'GET') return r.json();
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Verify caller is authenticated (has a valid JWT)
  const authHeader = req.headers.get('authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Validate caller's JWT with Supabase
  const callerToken = authHeader.replace('Bearer ', '');
  const callerRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${callerToken}` },
  });
  if (!callerRes.ok) {
    return new Response(JSON.stringify({ error: 'Invalid session' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { email, password, name, role, companyId } = await req.json();

    if (!email || !password || !name || !role || !companyId) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios em falta: email, password, name, role, companyId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Create user via Admin API (does NOT affect caller's session)
    const newUser = await sbAdmin('/users', 'POST', {
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    const userId = newUser.id;

    // 2. Insert profile in user_profiles
    await sbDb('/user_profiles', 'POST', {
      id: userId,
      company_id: companyId,
      email,
      name,
      role,
      status: 'active',
      must_change_password: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

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
