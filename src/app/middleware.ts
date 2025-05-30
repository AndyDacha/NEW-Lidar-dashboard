import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const USERNAME = 'Dacha2025LIDAR';
const PASSWORD = 'D4ch4LIDARLAR4337$';

export function middleware(request: NextRequest) {
  // Only enable auth in production
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.next();
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"'
      }
    });
  }

  // Decode base64 credentials
  const base64Credentials = authHeader.split(' ')[1];
  const [username, password] = atob(base64Credentials).split(':');

  if (username !== USERNAME || password !== PASSWORD) {
    return new NextResponse('Invalid credentials', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"'
      }
    });
  }

  return NextResponse.next();
}

// Apply to ALL pages
export const config = {
  matcher: '/:path*',
}; 