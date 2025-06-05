import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get the auth cookie
  const authCookie = request.cookies.get('auth')
  
  // Define protected routes
  const isProtectedRoute = 
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/reporting') ||
    request.nextUrl.pathname.startsWith('/site-drawing') ||
    request.nextUrl.pathname.startsWith('/mqtt-log') ||
    request.nextUrl.pathname.startsWith('/info') ||
    request.nextUrl.pathname.startsWith('/user-log') ||
    request.nextUrl.pathname.startsWith('/scott-work');

  // Allow access to static files and API routes
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  // If on root path and authenticated, redirect to dashboard
  if (request.nextUrl.pathname === '/' && authCookie?.value === 'true') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If on login page and already authenticated, redirect to dashboard
  if (request.nextUrl.pathname === '/login' && authCookie?.value === 'true') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If on a protected route and not authenticated, redirect to login
  if (isProtectedRoute && (!authCookie || authCookie.value !== 'true')) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnTo', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 