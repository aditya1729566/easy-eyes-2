import { NextRequest } from 'next/server';
import { z } from 'zod';
import { isAdmin } from '@/lib/auth';
import { serverDb } from '@/lib/supabase';
import { caught,fail,ok,sameOrigin } from '@/lib/http';
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){if(!sameOrigin(request))return fail('Invalid origin',403);if(!(await isAdmin()))return fail('Admin required',403);try{const {id}=await params;const {status}=z.object({status:z.enum(['approved','hidden'])}).parse(await request.json());const db=await serverDb();const {data,error}=await db.from('reviews').update({status}).eq('id',id).select('id,status').single();if(error)return fail('Review not found',404);return ok(data);}catch(e){return caught(e);}}
