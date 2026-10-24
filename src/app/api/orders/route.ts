import { NextRequest } from 'next/server';
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { serverDb } from '@/lib/supabase';
import { addressInput } from '@/lib/validation';
import { caught,fail,ok,sameOrigin } from '@/lib/http';
export async function GET(){try{const user=await currentUser();if(!user)return fail('Sign in required',401);const db=await serverDb();const {data,error}=await db.from('orders').select('id,order_number,created_at,total_minor,currency,order_status,payment_status').eq('user_id',user.id).order('created_at',{ascending:false});if(error)throw error;return ok(data);}catch(e){return caught(e);}}
export async function POST(request:NextRequest){if(!sameOrigin(request))return fail('Invalid origin',403);try{const user=await currentUser();if(!user)return fail('Sign in required',401);const input=z.object({address:addressInput,email:z.email(),note:z.string().max(1000).default(''),idempotency_key:z.uuid()}).parse(await request.json());const db=await serverDb();const {data,error}=await db.rpc('place_unpaid_order',{p_address:input.address,p_email:input.email,p_note:input.note,p_key:input.idempotency_key});if(error){if(error.code==='22023')return fail(error.message,409);return fail('Could not create order',400);}return ok({id:data,payment_status:'not_collected'},201);}catch(e){return caught(e);}}
