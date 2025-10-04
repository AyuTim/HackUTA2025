import { handleAuth } from '@auth0/nextjs-auth0';

// Next.js App Router requires named exports per HTTP method
export const GET = handleAuth();
export const POST = handleAuth();
