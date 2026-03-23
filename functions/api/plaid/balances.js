export async function onRequestGet(context) {
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

    // Get all connected institutions
    const institutionsRaw = await env.FOSTER_FINANCE.get('connected_institutions');
    if (!institutionsRaw) {
      return new Response(JSON.stringify({ accounts: [], institutions: [] }), { headers });
    }
    
    const institutions = JSON.parse(institutionsRaw);
    const allAccounts = [];
    const institutionSummaries = [];

    for (const inst of institutions) {
      try {
        const tokenRaw = await env.FOSTER_FINANCE.get(inst.key);
        if (!tokenRaw) continue;
        const tokenData = JSON.parse(tokenRaw);

        const response = await fetch(`${baseUrl}/accounts/balance/get`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: env.PLAID_CLIENT_ID,
            secret: env.PLAID_SECRET,
            access_token: tokenData.access_token,
          }),
        });

        const data = await response.json();
        
        if (!data.error_code && data.accounts) {
          for (const acct of data.accounts) {
            allAccounts.push({
              ...acct,
              institution_name: inst.name,
              institution_id: inst.id,
            });
          }
          institutionSummaries.push({
            name: inst.name,
            id: inst.id,
            connected_at: inst.connected_at,
            account_count: data.accounts.length,
          });
        }
      } catch (e) {
        console.error(`Error fetching ${inst.name}:`, e);
      }
    }

    return new Response(JSON.stringify({ 
      accounts: allAccounts, 
      institutions: institutionSummaries,
      fetched_at: new Date().toISOString(),
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
