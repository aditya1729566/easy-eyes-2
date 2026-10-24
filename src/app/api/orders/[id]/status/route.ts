import { NextRequest } from 'next/server';
import { z } from 'zod';
import { isAdmin } from '@/lib/auth';
import { serverDb } from '@/lib/supabase';
import { caught,fail,ok,sameOrigin } from '@/lib/http';
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){if(!sameOrigin(request))return fail('Invalid origin',403);if(!(await isAdmin()))return fail('Admin required',403);try{const {id}=await params;const input=z.object({status:z.enum(['confirmed','declined','cancelled']),note:z.string().max(500).optional()}).parse(await request.json());const db=await serverDb();const {error}=await db.rpc('set_order_status',{p_order:id,p_next:input.status,p_note:input.note||null});if(error)return fail('Invalid order transition',409);return ok({updated:true});}catch(e){return caught(e);}}
