import { createHash } from 'node:crypto';
import { NextRequest,NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { privilegedDb } from '@/lib/supabase';
import { caught,fail,ok,sameOrigin } from '@/lib/http';
export async function POST(request:NextRequest){if(!sameOrigin(request))return fail('Invalid origin',403);try{
 const user=await currentUser();if(!user)return fail('Sign in required',401);const token=request.cookies.get('ee_guest')?.value;if(!token)return ok({merged:true,conflicts:[]});
 const db=privilegedDb();const hash=createHash('sha256').update(token).digest('hex');const {data:guest}=await db.from('carts').select('id').eq('guest_session_hash',hash).maybeSingle();if(!guest)return ok({merged:true,conflicts:[]});
 let {data:owned}=await db.from('carts').select('id').eq('user_id',user.id).maybeSingle();if(!owned){const result=await db.from('carts').insert({user_id:user.id}).select('id').single();if(result.error)throw result.error;owned=result.data;}
 const {data:items}=await db.from('cart_items').select('id,variant_id,quantity').eq('cart_id',guest.id);
 const conflicts:string[]=[];
 for(const item of items||[]){const [{data:existing},{data:variant}]=await Promise.all([db.from('cart_items').select('id,quantity').eq('cart_id',owned.id).eq('variant_id',item.variant_id).maybeSingle(),db.from('product_variants').select('stock_quantity,active').eq('id',item.variant_id).single()]);const sum=item.quantity+(existing?.quantity||0);if(!variant?.active||sum>variant.stock_quantity||sum>20){conflicts.push(item.variant_id);continue;}if(existing)await db.from('cart_items').update({quantity:sum}).eq('id',existing.id);else await db.from('cart_items').insert({cart_id:owned.id,variant_id:item.variant_id,quantity:item.quantity});await db.from('cart_items').delete().eq('id',item.id);}
 if(conflicts.length===0)await db.from('carts').delete().eq('id',guest.id);
 const response=NextResponse.json({data:{merged:conflicts.length===0,conflicts}});if(!conflicts.length)response.cookies.delete('ee_guest');return response;
}catch(e){return caught(e);}}
