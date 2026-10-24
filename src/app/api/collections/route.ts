import { NextRequest } from 'next/server';
import { z } from 'zod';
import { isAdmin } from '@/lib/auth';
import { configured, serverDb } from '@/lib/supabase';
import { caught,fail,ok,sameOrigin } from '@/lib/http';
const schema=z.object({slug:z.string().regex(/^[a-z0-9-]+$/),name:z.string().min(2),description:z.string().default(''),hero_image_path:z.string().nullable().optional(),published:z.boolean().default(false),display_order:z.number().int().default(0)});
export async function GET(){if(!configured)return fail('Catalog is not configured.',503);try{const db=await serverDb();const {data,error}=await db.from('collections').select('*').eq('published',true).order('display_order');if(error)throw error;return ok(data);}catch(e){return caught(e);}}
export async function POST(request:NextRequest){if(!sameOrigin(request))return fail('Invalid origin',403);if(!(await isAdmin()))return fail('Admin required',403);try{const db=await serverDb();const input=schema.parse(await request.json());const {data,error}=await db.from('collections').insert(input).select().single();if(error)return fail('Could not create collection',400);return ok(data,201);}catch(e){return caught(e);}}
