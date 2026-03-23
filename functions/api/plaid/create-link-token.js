export async function onRequestPost(context) {
  const { env } = context;
  
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const plaidEnv = env.PLAID_ENV || 'sandbox';
    const baseUrl = plaidEnv === 'production' 
      ? 'https://production.plaid.com'
      : plaidEnv === 'development' 
        ? 'https://development.plaid.com'
        : 'https://sandbox.plaid.com';

    const response = await fetch(`${baseUrl}/link/token/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: env.PLAID_CLIENT_ID,
        secret: env.PLAID_SECRET,
        user: { client_user_id: 'foster-finance-user' },
        client_name: 'Foster Finance Hub',
        products: ['transactions'],
        country_codes: ['US'],
        language: 'en',
        redirect_uri: null,
      }),
    });

    const data = await response.json();
    
    if (data.error_code) {
      return new Response(JSON.stringify({ error: data.error_message }), { status: 400, headers });
    }

    return new Response(JSON.stringify({ link_token: data.link_token }), { headers });
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
