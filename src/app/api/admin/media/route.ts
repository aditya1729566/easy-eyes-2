import { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { isAdmin } from '@/lib/auth';
import { serverDb } from '@/lib/supabase';
import { caught,fail,ok,sameOrigin } from '@/lib/http';
export async function POST(request:NextRequest){if(!sameOrigin(request))return fail('Invalid origin',403);if(!(await isAdmin()))return fail('Admin required',403);try{const form=await request.formData();const file=form.get('file');const bucket=form.get('bucket');if(!(file instanceof File)||!['catalog','campaigns'].includes(String(bucket)))return fail('File and bucket required');const allowed=['image/jpeg','image/png','image/webp','image/avif',...(bucket==='campaigns'?['video/mp4']:[])];if(!allowed.includes(file.type)||file.size>(bucket==='campaigns'?50:10)*1024*1024)return fail('Unsupported file',422);const ext=file.type==='video/mp4'?'mp4':file.type.split('/')[1];const path=`${randomUUID()}.${ext}`;const db=await serverDb();const {error}=await db.storage.from(String(bucket)).upload(path,file,{contentType:file.type,upsert:false});if(error)return fail('Upload failed',400);return ok({bucket,path},201);}catch(e){return caught(e);}}
