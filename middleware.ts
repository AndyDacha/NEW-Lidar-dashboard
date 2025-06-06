import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authCookie = request.cookies.get('auth');
  console.log('[MIDDLEWARE] Path:', pathname, '| Auth cookie:', authCookie?.value);
  // Allow access to login and static files
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api')
  ) {
    return NextResponse.next();
  }
  // Protect /dashboard
  if (pathname.startsWith('/dashboard')) {
    if (!authCookie || authCookie.value !== 'true') {
      console.log('[MIDDLEWARE] Redirecting to /login from', pathname);
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      return NextResponse.redirect(loginUrl);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/((?!_next|favicon.ico|api|login).*)'],
}; 