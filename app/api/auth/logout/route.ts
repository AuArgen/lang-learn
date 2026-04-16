import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  
  cookieStore.set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0, 
    path: '/',
  });

  cookieStore.delete('session');

  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');

  return NextResponse.redirect(`${protocol}://${host}/`);
}
