import { NextRequest } from 'next/server';
import { z } from 'zod';
import { cartContext, cartLines, cartResponse } from '@/lib/cart';
import { caught,fail,sameOrigin } from '@/lib/http';
export async function POST(request:NextRequest){if(!sameOrigin(request))return fail('Invalid origin',403);try{
 const {variant_id,quantity}=z.object({variant_id:z.uuid(),quantity:z.number().int().min(1).max(20)}).parse(await request.json());
 const ctx=await cartContext(request);
 const {data:variant,error:variantError}=await ctx.db.from('product_variants').select('id,stock_quantity,active,products(status)').eq('id',variant_id).single();
 const product=Array.isArray(variant?.products)?variant.products[0]:variant?.products;
 if(variantError||!variant||!variant.active||product?.status!=='published')return fail('Product unavailable',404);
 const {data:existing}=await ctx.db.from('cart_items').select('id,quantity').eq('cart_id',ctx.cartId).eq('variant_id',variant_id).maybeSingle();
 const next=quantity+(existing?.quantity||0);if(next>variant.stock_quantity||next>20)return fail('Requested quantity is unavailable',409);
 const {error}=await ctx.db.from('cart_items').upsert({id:existing?.id,cart_id:ctx.cartId,variant_id,quantity:next},{onConflict:'cart_id,variant_id'});if(error)throw error;
 return cartResponse(await cartLines(ctx.db,ctx.cartId),ctx.guestToken,201);
}catch(e){return caught(e);}}
