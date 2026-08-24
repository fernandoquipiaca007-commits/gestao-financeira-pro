// Edge Function: create-user
// Cria um utilizador no Supabase Auth usando a Service Role Key (Admin API)
// sem afectar a sessão do owner que está a chamar esta função.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, password, name, role, companyId } = await req.json();

    if (!email || !name || !role || !companyId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Campos obrigatórios em falta: email, nome, cargo ou empresa.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password ? String(password) : 'Mudar123!';

    if (cleanPassword.length < 6) {
      return new Response(
        JSON.stringify({ success: false, error: 'A senha temporária deve ter no mínimo 6 caracteres.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let userId: string | null = null;

    // 1. Tentar criar utilizador via Admin API (com Service Role Key)
    const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: cleanEmail,
        password: cleanPassword,
        email_confirm: true,
        user_metadata: { name: name.trim() },
      }),
    });

    const userData = await createRes.json();

    if (createRes.ok && userData?.id) {
      userId = userData.id;
    } else {
      // Se o utilizador já existe no Auth (ex: erro 422 "already registered")
      const errMsg = userData?.message || userData?.msg || userData?.error_description || '';
      console.warn('[create-user] Admin create returned:', createRes.status, errMsg);

      // Verificar se já existe perfil na tabela user_profiles
      const findRes = await fetch(
        `${SUPABASE_URL}/rest/v1/user_profiles?email=eq.${encodeURIComponent(cleanEmail)}&select=id`,
        {
          headers: {
            apikey: SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          },
        }
      );
      const existingProfiles = await findRes.json();

      if (Array.isArray(existingProfiles) && existingProfiles.length > 0) {
        userId = existingProfiles[0].id;
      } else {
        // Retornar a mensagem clara de erro
        return new Response(
          JSON.stringify({
            success: false,
            error: errMsg || 'Não foi possível registar o utilizador no Supabase Auth.',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 2. Guardar / atualizar perfil em user_profiles com upsert seguro
    const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({
        id: userId,
        company_id: companyId,
        email: cleanEmail,
        name: name.trim(),
        role: role,
        status: 'active',
        must_change_password: true,
        updated_at: new Date().toISOString(),
      }),
    });

    if (!profileRes.ok) {
      const profileErr = await profileRes.text();
      console.error('[create-user] user_profiles upsert failed:', profileErr);
    }

    return new Response(
      JSON.stringify({ success: true, userId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro interno no servidor ao criar utilizador.';
    console.error('[create-user] Server exception:', msg);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
