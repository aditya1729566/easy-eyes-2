import { NextRequest } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { serverDb } from '@/lib/supabase';
import { variantInput } from '@/lib/validation';
import { caught,fail,ok,sameOrigin } from '@/lib/http';
export async function POST(request:NextRequest){if(!sameOrigin(request))return fail('Invalid origin',403);if(!(await isAdmin()))return fail('Admin required',403);try{const input=variantInput.parse(await request.json());const db=await serverDb();const {data,error}=await db.from('product_variants').insert(input).select().single();if(error)return fail('Could not create variant',400);return ok(data,201);}catch(e){return caught(e);}}
