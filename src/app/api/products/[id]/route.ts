import { NextRequest } from 'next/server';
import { getProduct } from '@/lib/catalog';
import { isAdmin } from '@/lib/auth';
import { serverDb } from '@/lib/supabase';
import { caught, fail, ok, sameOrigin } from '@/lib/http';
import { productInput } from '@/lib/validation';
export async function GET(_:NextRequest,{params}:{params:Promise<{id:string}>}) { try {const {id}=await params;const product=await getProduct(id);return product?ok(product):fail('Product not found',404);}catch(e){return caught(e);} }
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}) {
  if(!sameOrigin(request)) return fail('Invalid origin',403); if(!(await isAdmin())) return fail('Admin required',403);
  try {const {id}=await params;const input=productInput.partial().parse(await request.json());const db=await serverDb();const {data,error}=await db.from('products').update(input).eq('id',id).select().single();if(error)return fail('Could not update product',400);return ok(data);}catch(e){return caught(e);}
}
export async function DELETE(request:NextRequest,{params}:{params:Promise<{id:string}>}) {
  if(!sameOrigin(request)) return fail('Invalid origin',403); if(!(await isAdmin())) return fail('Admin required',403);
  try {const {id}=await params;const db=await serverDb();const {error}=await db.from('products').update({status:'archived'}).eq('id',id);if(error)return fail('Could not archive product',400);return ok({archived:true});}catch(e){return caught(e);}
}
