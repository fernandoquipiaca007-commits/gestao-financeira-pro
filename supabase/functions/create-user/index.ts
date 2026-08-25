// Edge Function: create-user
// Cria ou vincula um utilizador no Supabase Auth usando a Service Role Key (Admin API)
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
    const cleanName = name.trim();
    const cleanPassword = password ? String(password) : 'Mudar123!';

    if (cleanPassword.length < 6) {
      return new Response(
        JSON.stringify({ success: false, error: 'A senha temporária deve ter no mínimo 6 caracteres.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let userId: string | null = null;

    // 1. Tentar criar utilizador via Admin API
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
        user_metadata: { name: cleanName },
      }),
    });

    const userData = await createRes.json();

    if (createRes.ok && userData?.id) {
      userId = userData.id;
      console.log(`[create-user] Utilizador novo criado no Auth: ${userId}`);
    } else {
      console.log(`[create-user] Utilizador já registado no Auth. Procurando ID...`);

      // 1.1. Buscar em user_profiles primeiro
      const findProfileRes = await fetch(
        `${SUPABASE_URL}/rest/v1/user_profiles?email=eq.${encodeURIComponent(cleanEmail)}&select=id`,
        {
          headers: {
            apikey: SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          },
        }
      );
      const existingProfiles = await findProfileRes.json();
      if (Array.isArray(existingProfiles) && existingProfiles.length > 0 && existingProfiles[0]?.id) {
        userId = existingProfiles[0].id;
      }

      // 1.2. Se não estiver em user_profiles, buscar na lista auth.users via Admin API
      if (!userId) {
        const listUsersRes = await fetch(
          `${SUPABASE_URL}/auth/v1/admin/users?per_page=1000`,
          {
            headers: {
              apikey: SERVICE_ROLE_KEY,
              Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
            },
          }
        );
        if (listUsersRes.ok) {
          const listData = await listUsersRes.json();
          const authUsers = listData?.users || (Array.isArray(listData) ? listData : []);
          const matchedUser = authUsers.find(
            (u: { id?: string; email?: string }) => u.email && u.email.toLowerCase() === cleanEmail
          );
          if (matchedUser?.id) {
            userId = matchedUser.id;
            console.log(`[create-user] ID encontrado em auth.users: ${userId}`);
          }
        }
      }

      if (!userId) {
        const errMsg = userData?.message || userData?.msg || userData?.error_description || '';
        return new Response(
          JSON.stringify({
            success: false,
            error: errMsg || 'Não foi possível obter o identificador do utilizador no Supabase.',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 1.3. Atualizar a senha e metadados do utilizador existente no Auth
      if (cleanPassword) {
        try {
          await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
              apikey: SERVICE_ROLE_KEY,
              Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              password: cleanPassword,
              user_metadata: { name: cleanName },
              email_confirm: true,
            }),
          });
        } catch (updateErr) {
          console.warn('[create-user] Falha ao atualizar senha do utilizador existente:', updateErr);
        }
      }
    }

    // 2. Guardar / atualizar perfil em user_profiles com upsert
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
        name: cleanName,
        role: role,
        status: 'active',
        must_change_password: true,
        updated_at: new Date().toISOString(),
      }),
    });

    if (!profileRes.ok) {
      const profileErr = await profileRes.text();
      console.error('[create-user] user_profiles upsert failed:', profileErr);
    } else {
      console.log(`[create-user] Perfil guardado em user_profiles para ${cleanEmail} (${role})`);
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
