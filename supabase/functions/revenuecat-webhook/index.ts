// @ts-nocheck
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ACTIVE_EVENT_TYPES = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'PRODUCT_CHANGE']);

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  const expectedAuth = Deno.env.get('REVENUECAT_WEBHOOK_AUTH');

  const isAuthorized =
    !expectedAuth || authHeader === expectedAuth || authHeader === `Bearer ${expectedAuth}`;

  if (!isAuthorized) {
    console.error('Unauthorized webhook request');
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { event } = body ?? {};

    if (!event) {
      console.error('No event in webhook payload');
      return new Response('Missing event', { status: 400, headers: corsHeaders });
    }

    if (!event.app_user_id) {
      console.error('Missing app_user_id in webhook payload');
      return new Response('Missing app_user_id', { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Supabase environment variables are missing');
      return new Response('Server misconfigured', { status: 500, headers: corsHeaders });
    }

    console.log(`Processing RevenueCat event: ${event.type} for ${event.app_user_id}`);

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const isActive = event.type === 'EXPIRATION' ? false : ACTIVE_EVENT_TYPES.has(event.type);

    const { error: upsertError } = await supabase.from('subscriptions').upsert(
      {
        user_id: event.app_user_id,
        revenuecat_app_user_id: event.app_user_id,
        is_active: isActive,
        entitlement_ids: event.entitlement_ids || [],
        product_id: event.product_id || null,
        store: event.store || null,
        environment: event.environment || null,
        purchased_at: event.purchased_at_ms ? new Date(event.purchased_at_ms).toISOString() : null,
        expires_at: event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null,
        last_event_type: event.type,
        last_event_at: event.event_timestamp_ms
          ? new Date(event.event_timestamp_ms).toISOString()
          : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    );

    if (upsertError) {
      console.error('Error upserting subscription:', upsertError);
      return new Response(JSON.stringify({ error: upsertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Successfully processed ${event.type} for user ${event.app_user_id}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
