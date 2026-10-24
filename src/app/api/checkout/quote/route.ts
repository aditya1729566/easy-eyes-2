import { NextRequest } from 'next/server';
import { cartContext,cartLines,cartResponse } from '@/lib/cart';
import { caught,fail } from '@/lib/http';
import { configured } from '@/lib/supabase';
export async function GET(request:NextRequest){if(!configured)return fail('Checkout is not configured',503);try{const ctx=await cartContext(request);const lines=await cartLines(ctx.db,ctx.cartId);let subtotal=0;for(const line of lines){const v=line.product_variants;if(v)subtotal+=v.price_minor*line.quantity;}const {data:settings}=await ctx.db.from('store_settings').select('shipping_minor').eq('id',true).single();const shipping=lines.length?(settings?.shipping_minor||0):0;return cartResponse({subtotal_minor:subtotal,shipping_minor:shipping,total_minor:subtotal+shipping,currency:'INR'},ctx.guestToken);}catch(e){return caught(e);}}
