import { NextRequest } from 'next/server';
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { serverDb } from '@/lib/supabase';
import { caught,fail,ok,sameOrigin } from '@/lib/http';
export async function GET(){try{const user=await currentUser();if(!user)return fail('Sign in required',401);const db=await serverDb();const {data,error}=await db.from('wishlists').select('product_id,created_at,products(id,slug,name,base_price_minor,product_images(storage_path,alt_text,display_order))').eq('user_id',user.id);if(error)throw error;return ok(data);}catch(e){return caught(e);}}
export async function POST(request:NextRequest){if(!sameOrigin(request))return fail('Invalid origin',403);try{const user=await currentUser();if(!user)return fail('Sign in required',401);const {product_id}=z.object({product_id:z.uuid()}).parse(await request.json());const db=await serverDb();const {error}=await db.from('wishlists').upsert({user_id:user.id,product_id});if(error)return fail('Could not save product',400);return ok({saved:true},201);}catch(e){return caught(e);}}
export async function DELETE(request:NextRequest){if(!sameOrigin(request))return fail('Invalid origin',403);try{const user=await currentUser();if(!user)return fail('Sign in required',401);const product_id=request.nextUrl.searchParams.get('product_id');if(!product_id)return fail('Product required');const db=await serverDb();const {error}=await db.from('wishlists').delete().eq('user_id',user.id).eq('product_id',product_id);if(error)throw error;return ok({removed:true});}catch(e){return caught(e);}}
