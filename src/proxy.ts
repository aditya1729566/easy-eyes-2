import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
export async function proxy(request: NextRequest) {
  if (!request.cookies.getAll().some(({ name }) => /^sb-[a-z0-9]+-auth-token(?:\.\d+)?$/.test(name))) {
    return NextResponse.next({ request });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next({ request });
  let response = NextResponse.next({ request });
  const db = createServerClient(url,key,{ cookies: {
    getAll: () => request.cookies.getAll(),
    setAll: (items) => {
      items.forEach(({name,value}) => request.cookies.set(name,value));
      response = NextResponse.next({ request });
      items.forEach(({name,value,options}) => response.cookies.set(name,value,options));
    },
  }});
  await db.auth.getClaims();
  return response;
}
export const config = { matcher: ['/account/:path*', '/admin/:path*', '/checkout', '/order-confirmation/:path*', '/wishlist', '/api/:path*', '/auth/:path*'] };
