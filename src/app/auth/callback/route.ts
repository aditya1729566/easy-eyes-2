import { NextRequest, NextResponse } from 'next/server';
import { safeAuthNext } from '@/lib/auth-next';
import { serverDb } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const loginError = new URL('/login?oauth_error=1', request.url);
  if (!code || request.nextUrl.searchParams.has('error')) return NextResponse.redirect(loginError);

  const db = await serverDb();
  const { error } = await db.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(loginError);

  const destination = safeAuthNext(request.nextUrl.searchParams.get('next'));
  const complete = new URL('/auth/complete', request.url);
  complete.searchParams.set('next', destination);
  return NextResponse.redirect(complete);
}
