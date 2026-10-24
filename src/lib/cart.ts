import { createHash, randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from './auth';
import { privilegedDb } from './supabase';
const cookieName = 'ee_guest';
export async function cartContext(request: NextRequest) {
  const user = await currentUser();
  const db = privilegedDb();
  if (user) {
    let { data: cart } = await db.from('carts').select('id').eq('user_id',user.id).maybeSingle();
    if (!cart) { const result = await db.from('carts').insert({user_id:user.id}).select('id').single(); if (result.error) throw result.error; cart=result.data; }
    return { db, cartId: cart.id as string, userId: user.id, guestToken: null as string | null };
  }
  let guestToken = request.cookies.get(cookieName)?.value;
  const fresh = !guestToken || !/^[a-f0-9]{64}$/.test(guestToken);
  if (fresh) guestToken = randomBytes(32).toString('hex');
  const hash = createHash('sha256').update(guestToken!).digest('hex');
  let { data: cart } = await db.from('carts').select('id').eq('guest_session_hash',hash).maybeSingle();
  if (!cart) { const result = await db.from('carts').insert({guest_session_hash:hash}).select('id').single(); if (result.error) throw result.error; cart=result.data; }
  return { db, cartId: cart.id as string, userId: null, guestToken: fresh ? guestToken! : null };
}
export function cartResponse(data: unknown, token: string | null, status=200) {
  const response = NextResponse.json({ data }, { status });
  if (token) response.cookies.set(cookieName, token, { httpOnly:true, secure:process.env.NODE_ENV==='production', sameSite:'lax', path:'/', maxAge:60*60*24*30 });
  return response;
}
export async function cartLines(db: ReturnType<typeof privilegedDb>,cartId:string) {
  const { data,error } = await db.from('cart_items').select('id,quantity,variant_id,product_variants(id,sku,frame_color,lens_color,price_minor,stock_quantity,active,products(id,slug,name,status,product_images(storage_path,alt_text,display_order)))').eq('cart_id',cartId).order('created_at');
  if (error) throw error;
  type ProductJoin = { id:string; slug:string; name:string; status:string; product_images:{storage_path:string;alt_text:string;display_order:number}[] };
  type VariantJoin = { id:string; sku:string; frame_color:string; lens_color:string; price_minor:number; stock_quantity:number; active:boolean; products:ProductJoin|ProductJoin[] };
  const one = <T,>(value:T|T[]):T => Array.isArray(value) ? value[0] : value;
  return (data || []).map(line => {
    const variant=one(line.product_variants as unknown as VariantJoin|VariantJoin[]);
    return { id:line.id, quantity:line.quantity, variant_id:line.variant_id, product_variants:{...variant,products:one(variant.products)} };
  });
}
