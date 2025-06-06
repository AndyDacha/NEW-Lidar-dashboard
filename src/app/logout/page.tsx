import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default function LogoutPage() {
  // Clear cookies
  const cookieStore = cookies();
  cookieStore.set('auth', '', { path: '/', maxAge: 0 });
  cookieStore.set('userRole', '', { path: '/', maxAge: 0 });
  cookieStore.set('username', '', { path: '/', maxAge: 0 });
  // Redirect to login
  redirect('/login');
  return null;
} 