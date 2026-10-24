import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { serverDb } from '@/lib/supabase';
import { addressInput } from '@/lib/validation';
import { caught,fail,ok,sameOrigin } from '@/lib/http';
export async function GET(){try{const user=await currentUser();if(!user)return fail('Sign in required',401);const db=await serverDb();const {data,error}=await db.from('addresses').select('*').eq('user_id',user.id).order('created_at',{ascending:false});if(error)throw error;return ok(data);}catch(e){return caught(e);}}
export async function POST(request:NextRequest){if(!sameOrigin(request))return fail('Invalid origin',403);try{const user=await currentUser();if(!user)return fail('Sign in required',401);const input=addressInput.parse(await request.json());const db=await serverDb();const {data,error}=await db.from('addresses').insert({...input,user_id:user.id}).select().single();if(error)throw error;return ok(data,201);}catch(e){return caught(e);}}
