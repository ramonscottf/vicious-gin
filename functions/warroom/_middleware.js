export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  
  const cookie = request.headers.get('Cookie') || '';
  const authed = cookie.includes('warroom_auth=TrustTheAwesome');

  if (authed) {
    return context.next();
  }

  if (request.method === 'POST') {
    const formData = await request.formData();
    const password = formData.get('password');
    
    if (password === 'TrustTheAwesome') {
      const response = new Response(null, {
        status: 302,
        headers: {
          'Location': url.pathname,
          'Set-Cookie': 'warroom_auth=TrustTheAwesome; Path=/warroom; HttpOnly; Secure; SameSite=Strict; Max-Age=86400',
        },
      });
      return response;
    }
    
    return new Response(loginPage('Wrong password.'), {
      headers: { 'Content-Type': 'text/html' },
      status: 401,
    });
  }

  return new Response(loginPage(), {
    headers: { 'Content-Type': 'text/html' },
  });
}

function loginPage(error = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ACCESS RESTRICTED</title>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#06060b;color:#c8ccd0;font-family:'JetBrains Mono',monospace;height:100vh;display:flex;align-items:center;justify-content:center}
.container{text-align:center;width:360px}
.icon{font-size:64px;margin-bottom:16px}
.title{font-size:14px;font-weight:800;letter-spacing:4px;color:#ff1744;margin-bottom:4px}
.sub{font-size:10px;color:#546e7a;letter-spacing:2px;margin-bottom:32px}
input{background:#0a0a12;border:1px solid #1a1a2e;color:#c8ccd0;padding:12px 16px;border-radius:3px;font-family:inherit;font-size:13px;width:100%;outline:none;text-align:center;letter-spacing:2px;margin-bottom:12px}
input:focus{border-color:#ff1744}
button{background:#ff1744;color:#fff;border:none;padding:10px 32px;border-radius:3px;font-size:11px;font-weight:700;letter-spacing:2px;cursor:pointer;font-family:inherit;text-transform:uppercase;width:100%}
button:hover{background:#d50000}
.error{color:#ff1744;font-size:11px;margin-bottom:12px;letter-spacing:1px}
.footer{margin-top:32px;font-size:9px;color:#1a1a2e;letter-spacing:1px}
</style>
</head>
<body>
<div class="container">
<div class="icon">&#9763;</div>
<div class="title">SKIPPY WAR ROOM</div>
<div class="sub">CLASSIFIED — AUTHORIZED ACCESS ONLY</div>
${error ? '<div class="error">' + error + '</div>' : ''}
<form method="POST">
<input type="password" name="password" placeholder="ENTER PASSPHRASE" autofocus>
<button type="submit">AUTHENTICATE</button>
</form>
<div class="footer">FOSTER LABS INTELLIGENCE DIVISION</div>
</div>
</body>
</html>`;
}
