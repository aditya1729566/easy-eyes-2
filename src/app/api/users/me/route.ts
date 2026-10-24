import { NextRequest } from 'next/server';
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { serverDb } from '@/lib/supabase';
import { caught,fail,ok,sameOrigin } from '@/lib/http';
export async function GET(){try{const user=await currentUser();if(!user)return fail('Sign in required',401);const db=await serverDb();const {data,error}=await db.from('profiles').select('id,full_name,phone,created_at').eq('id',user.id).single();if(error)throw error;return ok({...data,email:user.email});}catch(e){return caught(e);}}
export async function PATCH(request:NextRequest){if(!sameOrigin(request))return fail('Invalid origin',403);try{const user=await currentUser();if(!user)return fail('Sign in required',401);const input=z.object({full_name:z.string().min(2).max(120).optional(),phone:z.string().max(25).nullable().optional()}).parse(await request.json());const db=await serverDb();const {data,error}=await db.from('profiles').update(input).eq('id',user.id).select('id,full_name,phone').single();if(error)throw error;return ok(data);}catch(e){return caught(e);}}
