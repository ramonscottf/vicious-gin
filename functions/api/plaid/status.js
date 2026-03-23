export async function onRequestGet(context) {
  const { env } = context;
  
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const hasPlaidKeys = !!(env.PLAID_CLIENT_ID && env.PLAID_SECRET);
    const plaidEnv = env.PLAID_ENV || 'sandbox';
    
    let institutions = [];
    try {
      const raw = await env.FOSTER_FINANCE.get('connected_institutions');
      if (raw) institutions = JSON.parse(raw);
    } catch(e) {}

    return new Response(JSON.stringify({
      status: 'ok',
      plaid_configured: hasPlaidKeys,
      plaid_env: plaidEnv,
      connected_institutions: institutions.map(i => ({
        name: i.name,
        connected_at: i.connected_at,
      })),
      kv_bound: !!env.FOSTER_FINANCE,
    }), { headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
