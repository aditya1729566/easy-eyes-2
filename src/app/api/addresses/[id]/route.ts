import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { serverDb } from '@/lib/supabase';
import { addressInput } from '@/lib/validation';
import { caught,fail,ok,sameOrigin } from '@/lib/http';
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){if(!sameOrigin(request))return fail('Invalid origin',403);try{const user=await currentUser();if(!user)return fail('Sign in required',401);const {id}=await params;const input=addressInput.partial().parse(await request.json());const db=await serverDb();const {data,error}=await db.from('addresses').update(input).eq('id',id).eq('user_id',user.id).select().single();if(error)return fail('Address not found',404);return ok(data);}catch(e){return caught(e);}}
export async function DELETE(request:NextRequest,{params}:{params:Promise<{id:string}>}){if(!sameOrigin(request))return fail('Invalid origin',403);try{const user=await currentUser();if(!user)return fail('Sign in required',401);const {id}=await params;const db=await serverDb();const {error}=await db.from('addresses').delete().eq('id',id).eq('user_id',user.id);if(error)throw error;return ok({deleted:true});}catch(e){return caught(e);}}
