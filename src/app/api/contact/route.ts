import { createHash } from 'node:crypto';
import { NextRequest } from 'next/server';
import { configured,privilegedDb } from '@/lib/supabase';
import { contactInput } from '@/lib/validation';
import { caught,fail,ok,sameOrigin } from '@/lib/http';
export async function POST(request:NextRequest){if(!sameOrigin(request))return fail('Invalid origin',403);if(!configured)return fail('Contact is not configured',503);try{const input=contactInput.parse(await request.json());const ip=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';const salt=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;if(!salt)return fail('Contact is not configured',503);const actor=createHash('sha256').update(`${ip}:${input.email.toLowerCase()}:${salt}`).digest('hex');const db=privilegedDb();const {error}=await db.rpc('submit_contact_message',{p_actor_hash:actor,p_name:input.sender_name,p_email:input.email,p_subject:input.subject,p_body:input.body});if(error?.code==='P0001')return fail('Please wait before sending another message.',429);if(error)throw error;return ok({received:true},201);}catch(e){return caught(e);}}
