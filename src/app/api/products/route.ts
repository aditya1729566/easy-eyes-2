import { NextRequest } from 'next/server';
import { listProducts } from '@/lib/catalog';
import { isAdmin } from '@/lib/auth';
import { configured, serverDb } from '@/lib/supabase';
import { caught, fail, ok, sameOrigin } from '@/lib/http';
import { productInput } from '@/lib/validation';
export async function GET(request: NextRequest) {
  if (!configured) return fail('Catalog is not configured.',503);
  try {
    const sp=request.nextUrl.searchParams;
    const page=Number(sp.get('page')||1);
    if (!Number.isInteger(page)||page<1||page>1000) return fail('Invalid page');
    return ok(await listProducts({ q:sp.get('q')||undefined, sort:sp.get('sort')||undefined, page }));
  } catch(e) { return caught(e); }
}
export async function POST(request:NextRequest) {
  if (!sameOrigin(request)) return fail('Invalid origin',403);
  if (!(await isAdmin())) return fail('Admin required',403);
  try {
    const input=productInput.parse(await request.json());
    const db=await serverDb(); const {data,error}=await db.from('products').insert(input).select().single();
    if(error) return fail('Could not create product',400); return ok(data,201);
  } catch(e) {return caught(e);}
}
