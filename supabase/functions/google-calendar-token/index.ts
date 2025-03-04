import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    // Create a Supabase client with the Admin key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: 'Missing Supabase credentials', url: !!supabaseUrl, key: !!supabaseKey }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey)
    
    // Get the request body
    const { userId } = await req.json()
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing user ID' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    // Get the user
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    if (userError) {
      return new Response(
        JSON.stringify({ error: 'User fetch error', details: userError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }
    
    if (!userData || !userData.user) {
      return new Response(
        JSON.stringify({ error: 'User not found', userId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }
    
    // Check if the user is authenticated with Google
    if (!userData.user.app_metadata || userData.user.app_metadata.provider !== 'google') {
      return new Response(
        JSON.stringify({ 
          error: 'User not authenticated with Google', 
          provider: userData.user.app_metadata?.provider,
          metadata: userData.user.app_metadata 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    // Get the refresh token from user's identities
    const identities = userData.user.identities || []
    if (!identities.length) {
      return new Response(
        JSON.stringify({ error: 'No identities found for user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    const googleIdentity = identities.find((identity) => identity.provider === 'google')
    
    if (!googleIdentity) {
      return new Response(
        JSON.stringify({ 
          error: 'Google identity not found', 
          providers: identities.map(i => i.provider) 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    if (!googleIdentity.refresh_token) {
      return new Response(
        JSON.stringify({ error: 'No refresh token found for Google identity' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    // Get Google client credentials
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID') ?? '';
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '';
    
    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing Google credentials', 
          clientId: !!clientId, 
          clientSecret: !!clientSecret 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
    
    // Get a fresh access token with calendar scope
    const tokenEndpoint = 'https://oauth2.googleapis.com/token'
    const formData = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: googleIdentity.refresh_token,
      grant_type: 'refresh_token',
      scope: 'https://www.googleapis.com/auth/calendar.readonly'
    })
    
    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    })
    
    const tokenData = await tokenResponse.json()
    
    if (!tokenResponse.ok) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to refresh token', 
          status: tokenResponse.status,
          details: tokenData 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
    
    // Return the access token
    return new Response(
      JSON.stringify({ access_token: tokenData.access_token }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: 'Unhandled exception', 
        message: error.message,
        stack: error.stack
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/google-calendar-token' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
