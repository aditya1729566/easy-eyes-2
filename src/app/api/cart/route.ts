import { NextRequest } from 'next/server';
import { cartContext, cartLines, cartResponse } from '@/lib/cart';
import { caught,fail,sameOrigin } from '@/lib/http';
export async function GET(request:NextRequest){try{const ctx=await cartContext(request);return cartResponse(await cartLines(ctx.db,ctx.cartId),ctx.guestToken);}catch(e){return caught(e);}}
export async function DELETE(request:NextRequest){if(!sameOrigin(request))return fail('Invalid origin',403);try{const ctx=await cartContext(request);const {error}=await ctx.db.from('cart_items').delete().eq('cart_id',ctx.cartId);if(error)throw error;return cartResponse([],ctx.guestToken);}catch(e){return caught(e);}}
