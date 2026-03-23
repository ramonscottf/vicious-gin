export async function onRequestGet(context) {
  const { env, request } = context;
  
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    
    const plaidEnv = env.PLAID_ENV || 'sandbox';
    const baseUrl = plaidEnv === 'production' 
      ? 'https://production.plaid.com'
      : plaidEnv === 'development' 
        ? 'https://development.plaid.com'
        : 'https://sandbox.plaid.com';

    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

    const institutionsRaw = await env.FOSTER_FINANCE.get('connected_institutions');
    if (!institutionsRaw) {
      return new Response(JSON.stringify({ transactions: [], total: 0 }), { headers });
    }
    
    const institutions = JSON.parse(institutionsRaw);
    let allTransactions = [];

    for (const inst of institutions) {
      try {
        const tokenRaw = await env.FOSTER_FINANCE.get(inst.key);
        if (!tokenRaw) continue;
        const tokenData = JSON.parse(tokenRaw);

        let offset = 0;
        let hasMore = true;

        while (hasMore) {
          const response = await fetch(`${baseUrl}/transactions/get`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_id: env.PLAID_CLIENT_ID,
              secret: env.PLAID_SECRET,
              access_token: tokenData.access_token,
              start_date: startDate,
              end_date: endDate,
              options: { count: 100, offset },
            }),
          });

          const data = await response.json();
          
          if (data.error_code) {
            console.error(`Plaid error for ${inst.name}:`, data.error_message);
            break;
          }

          if (data.transactions) {
            for (const txn of data.transactions) {
              allTransactions.push({
                ...txn,
                institution_name: inst.name,
              });
            }
            offset += data.transactions.length;
            hasMore = offset < data.total_transactions;
          } else {
            hasMore = false;
          }

          // Safety limit
          if (offset > 500) break;
        }
      } catch (e) {
        console.error(`Error fetching transactions for ${inst.name}:`, e);
      }
    }

    // Sort by date descending
    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Categorize and summarize
    const categories = {};
    let totalSpend = 0;
    let totalIncome = 0;

    for (const txn of allTransactions) {
      const cat = txn.personal_finance_category?.primary || txn.category?.[0] || 'Other';
      if (!categories[cat]) categories[cat] = { total: 0, count: 0 };
      
      if (txn.amount > 0) {
        categories[cat].total += txn.amount;
        categories[cat].count++;
        totalSpend += txn.amount;
      } else {
        totalIncome += Math.abs(txn.amount);
      }
    }

    return new Response(JSON.stringify({ 
      transactions: allTransactions,
      summary: {
        total_transactions: allTransactions.length,
        total_spend: totalSpend,
        total_income: totalIncome,
        categories,
        period: { start: startDate, end: endDate },
      },
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
