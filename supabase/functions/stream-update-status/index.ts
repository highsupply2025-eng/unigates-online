import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData } = await userClient.auth.getUser()
    if (!userData?.user) return json({ error: 'Unauthorized' }, 401)

    const { streamId, action } = await req.json()
    if (!streamId || !['start', 'end'].includes(action)) {
      return json({ error: 'Invalid input' }, 400)
    }

    const update: Record<string, unknown> = {}
    if (action === 'start') {
      update.status = 'live'
      update.started_at = new Date().toISOString()
    } else {
      update.status = 'ended'
      update.ended_at = new Date().toISOString()
    }

    const { data, error } = await userClient
      .from('cloudflare_live_streams')
      .update(update)
      .eq('id', streamId)
      .eq('lecturer_id', userData.user.id)
      .select()
      .single()
    if (error) return json({ error: error.message }, 403)
    return json({ success: true, stream: data })
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
