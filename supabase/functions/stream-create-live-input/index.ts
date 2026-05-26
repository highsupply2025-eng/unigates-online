import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userErr } = await userClient.auth.getUser()
    if (userErr || !userData.user) return json({ error: 'Unauthorized' }, 401)
    const userId = userData.user.id

    const body = await req.json().catch(() => ({}))
    const title = String(body.title || '').trim()
    const description = String(body.description || '').trim() || null
    if (!title || title.length > 255) return json({ error: 'Invalid title' }, 400)

    const accountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID')!
    const apiToken = Deno.env.get('CLOUDFLARE_STREAM_API_TOKEN')!

    const cfRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/live_inputs`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meta: { name: title },
          recording: { mode: 'automatic', requireSignedURLs: false },
        }),
      },
    )
    const cfJson = await cfRes.json()
    if (!cfRes.ok || !cfJson.success) {
      console.error('Cloudflare error', cfJson)
      return json({ error: 'Cloudflare API failed', details: cfJson.errors }, 500)
    }

    const r = cfJson.result
    const uid = r.uid
    const rtmpsUrl = r.rtmps?.url || 'rtmps://live.cloudflare.com:443/live/'
    const streamKey = r.rtmps?.streamKey
    const hls = `https://customer-${accountId}.cloudflarestream.com/${uid}/manifest/video.m3u8`
    const dash = `https://customer-${accountId}.cloudflarestream.com/${uid}/manifest/video.mpd`

    const admin = createClient(supabaseUrl, serviceKey)
    const { data: inserted, error: insErr } = await admin
      .from('cloudflare_live_streams')
      .insert({
        lecturer_id: userId,
        title,
        description,
        live_input_uid: uid,
        rtmps_url: rtmpsUrl,
        rtmps_stream_key: streamKey,
        playback_hls_url: hls,
        playback_dash_url: dash,
        status: 'idle',
      })
      .select()
      .single()
    if (insErr) return json({ error: insErr.message }, 500)

    return json({ success: true, stream: inserted })
  } catch (e) {
    console.error(e)
    return json({ error: String(e?.message || e) }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
