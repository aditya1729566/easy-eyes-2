import { NextRequest } from 'next/server';
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { serverDb } from '@/lib/supabase';
import { caught,fail,ok,sameOrigin } from '@/lib/http';
export async function GET(_:NextRequest,{params}:{params:Promise<{id:string}>}){try{const {id}=await params;const db=await serverDb();const {data,error}=await db.from('reviews').select('id,rating,title,body,created_at').eq('product_id',id).eq('status','approved').order('created_at',{ascending:false});if(error)throw error;return ok(data);}catch(e){return caught(e);}}
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){if(!sameOrigin(request))return fail('Invalid origin',403);try{const user=await currentUser();if(!user)return fail('Sign in required',401);const {id}=await params;const input=z.object({rating:z.number().int().min(1).max(5),title:z.string().min(3).max(120),body:z.string().min(20).max(2000)}).parse(await request.json());const db=await serverDb();const {data,error}=await db.from('reviews').insert({...input,product_id:id,user_id:user.id,status:'pending'}).select('id,status').single();if(error)return fail('Could not submit review; you may already have one',409);return ok(data,201);}catch(e){return caught(e);}}
