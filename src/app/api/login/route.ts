import { NextResponse } from 'next/server';
import { users } from '../../auth/users';

export async function POST(req: Request) {
  const { username, password } = await req.json();
  console.log('[LOGIN API] Received login attempt for:', username);
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    console.log('[LOGIN API] Invalid credentials for:', username);
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set('auth', 'true', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    maxAge: 86400,
  });
  res.cookies.set('userRole', user.role, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    maxAge: 86400,
  });
  res.cookies.set('username', encodeURIComponent(user.username), {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    maxAge: 86400,
  });
  console.log('[LOGIN API] Set cookies for:', username);
  return res;
} 