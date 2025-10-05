export async function GET() {
  const payload = {
    AUTH0_BASE_URL: process.env.AUTH0_BASE_URL,
    AUTH0_ISSUER_BASE_URL: process.env.AUTH0_ISSUER_BASE_URL,
    AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID ? '[set]' : '[missing]',
    AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET ? '[set]' : '[missing]',
    AUTH0_SECRET: process.env.AUTH0_SECRET ? '[set]' : '[missing]'
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
}


