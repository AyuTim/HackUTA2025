import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// For now, we'll skip middleware authentication
// Auth0 v4 doesn't have withMiddlewareAuthRequired in /edge
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"
  ]
};
