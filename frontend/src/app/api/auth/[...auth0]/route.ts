import { handleAuth } from '@auth0/nextjs-auth0';

// Next.js 15 makes route params async (a promise).
// Wrap Auth0's handler so we await params before passing them through.
const authHandler = handleAuth();

export async function GET(request: Request, ctx: { params: Promise<{ auth0: string[] }> }) {
  const params = await ctx.params;
  // @ts-ignore - Auth0 handler accepts the same signature used by Next
  return authHandler(request, { params });
}

export async function POST(request: Request, ctx: { params: Promise<{ auth0: string[] }> }) {
  const params = await ctx.params;
  // @ts-ignore - Auth0 handler accepts the same signature used by Next
  return authHandler(request, { params });
}
