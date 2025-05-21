import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('auth')
  
  // If no auth cookie is present and trying to access protected routes
  if (!authCookie && (
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/reporting') ||
    request.nextUrl.pathname.startsWith('/site-drawing') ||
    request.nextUrl.pathname.startsWith('/mqtt-log') ||
    request.nextUrl.pathname.startsWith('/info')
  )) {
    // Redirect to login page
    return NextResponse.redirect(new URL('/login', request.url))
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
    '/info/:path*'
  ]
} 