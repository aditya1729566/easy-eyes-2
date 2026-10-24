import { NextRequest } from 'next/server';
import { privilegedDb } from '@/lib/supabase';
import { caught,fail,ok } from '@/lib/http';
export async function GET(request:NextRequest){const secret=process.env.CRON_SECRET;if(!secret||request.headers.get('authorization')!==`Bearer ${secret}`)return fail('Unauthorized',401);try{const db=privilegedDb();const {data,error}=await db.rpc('expire_unconfirmed_orders');if(error)throw error;return ok({expired:data});}catch(e){return caught(e);}}
