import { NextRequest } from 'next/server';
import { currentUser,isAdmin } from '@/lib/auth';
import { serverDb } from '@/lib/supabase';
import { caught,fail,ok } from '@/lib/http';
export async function GET(_:NextRequest,{params}:{params:Promise<{id:string}>}){try{const user=await currentUser();if(!user)return fail('Sign in required',401);const {id}=await params;const db=await serverDb();let query=db.from('orders').select('*,order_items(*)').eq('id',id);if(!(await isAdmin()))query=query.eq('user_id',user.id);const {data,error}=await query.single();if(error)return fail('Order not found',404);return ok(data);}catch(e){return caught(e);}}
