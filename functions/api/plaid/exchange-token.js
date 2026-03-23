export async function onRequestPost(context) {
  const { env, request } = context;
  
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const { public_token, institution } = await request.json();
    
    const plaidEnv = env.PLAID_ENV || 'sandbox';
    const baseUrl = plaidEnv === 'production' 
      ? 'https://production.plaid.com'
      : plaidEnv === 'development' 
        ? 'https://development.plaid.com'
        : 'https://sandbox.plaid.com';

    // Exchange public token for access token
    const response = await fetch(`${baseUrl}/item/public_token/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: env.PLAID_CLIENT_ID,
        secret: env.PLAID_SECRET,
        public_token,
      }),
    });

    const data = await response.json();
    
    if (data.error_code) {
      return new Response(JSON.stringify({ error: data.error_message }), { status: 400, headers });
    }

    // Store access token in KV
    const tokenKey = `access_token_${institution?.institution_id || Date.now()}`;
    const tokenData = {
      access_token: data.access_token,
      item_id: data.item_id,
      institution_name: institution?.name || 'Unknown',
      institution_id: institution?.institution_id || 'unknown',
      connected_at: new Date().toISOString(),
    };
    
    await env.FOSTER_FINANCE.put(tokenKey, JSON.stringify(tokenData));
    
    // Also maintain a list of connected institutions
    let institutions = [];
    try {
      const existing = await env.FOSTER_FINANCE.get('connected_institutions');
      if (existing) institutions = JSON.parse(existing);
    } catch(e) {}
    
    institutions.push({
      key: tokenKey,
      name: institution?.name || 'Unknown',
      id: institution?.institution_id || 'unknown',
      connected_at: new Date().toISOString(),
    });
    
    await env.FOSTER_FINANCE.put('connected_institutions', JSON.stringify(institutions));

    return new Response(JSON.stringify({ 
      success: true, 
      institution: institution?.name || 'Unknown',
      item_id: data.item_id 
    }), { headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
