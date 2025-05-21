import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get the auth cookie
  const authCookie = request.cookies.get('auth')
  
  // Check if we're on a protected route
  const isProtectedRoute = 
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/reporting') ||
    request.nextUrl.pathname.startsWith('/site-drawing') ||
    request.nextUrl.pathname.startsWith('/mqtt-log') ||
    request.nextUrl.pathname.startsWith('/info') ||
    request.nextUrl.pathname.startsWith('/user-log') ||
    request.nextUrl.pathname.startsWith('/scott-work');

  // If on a protected route and no valid auth cookie
  if (isProtectedRoute && (!authCookie || authCookie.value !== 'true')) {
    // Create the login URL with the current URL as the return path
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('returnTo', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/reporting/:path*',
    '/site-drawing/:path*',
    '/mqtt-log/:path*',
    '/info/:path*',
    '/user-log/:path*',
    '/scott-work/:path*'
  ]
} 