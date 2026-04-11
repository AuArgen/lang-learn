import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJwtToken } from '@/lib/auth/jwt';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('session')?.value;

  // Paths that don't need auth (public)
  const publicPaths = ['/', '/api/auth/callback', '/play/']; // '/play/' for public links
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path));

  // Skip auth checks for completely public assets or API routes (unless custom secured)
  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (token) {
    const payload = await verifyJwtToken(token);
    
    if (!payload && !isPublicPath) {
      const response = NextResponse.redirect(new URL('/', request.url));
      response.cookies.delete('session');
      return response;
    }
    
    if (payload) {
      // Pass user info via headers to the app
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', payload.userId);
      requestHeaders.set('x-user-role', payload.role);
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth/callback|images).*)'],
};
