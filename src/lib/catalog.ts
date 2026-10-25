import { configured, serverDb } from './supabase';
import { cache } from 'react';
export type Product = { id: string; slug: string; name: string; description: string; base_price_minor: number; currency: string; category_id?: string|null; material: string | null; frame_shape: string | null; fit: string | null; featured_order: number | null; specifications?: Record<string,unknown>; product_images?: { storage_path: string; alt_text: string; display_order: number; variant_id?: string|null }[]; product_variants?: { id: string; sku: string; frame_color: string; lens_color: string; price_minor: number; stock_quantity: number }[] };
export function mediaUrl(path: string | null | undefined, bucket='catalog') {
  if (!path) return null;
  if (path.startsWith('/')) return path;
  return `/api/media/${encodeURIComponent(bucket)}/${path.split('/').map(encodeURIComponent).join('/')}`;
}
export type CatalogFilters = { q?:string; category?:string; sort?:string; page?:number; collection?:string; shape?:string; material?:string; frameColor?:string; lensColor?:string; available?:boolean; minPrice?:number; maxPrice?:number };
export async function filterOptions(){
  if(!configured)return {shapes:[] as string[],materials:[] as string[],frameColors:[] as string[],lensColors:[] as string[]};
  const db=await serverDb();
  const [{data:products},{data:variants}]=await Promise.all([db.from('products').select('frame_shape,material').eq('status','published').limit(500),db.from('product_variants').select('frame_color,lens_color,products!inner(status)').eq('active',true).eq('products.status','published').limit(500)]);
  const unique=(items:(string|null|undefined)[])=>Array.from(new Set(items.filter((x):x is string=>Boolean(x)))).sort();
  return {shapes:unique((products||[]).map(p=>p.frame_shape)),materials:unique((products||[]).map(p=>p.material)),frameColors:unique((variants||[]).map(v=>v.frame_color)),lensColors:unique((variants||[]).map(v=>v.lens_color))};
}
export async function listProducts(params: CatalogFilters = {}) {
  if (!configured) return { products: [] as Product[], count: 0, unavailable: true };
  const db = await serverDb();
  const page = Math.max(1, params.page || 1);
  let query = db.from('products').select('id,slug,name,description,base_price_minor,currency,material,frame_shape,fit,featured_order,product_images(storage_path,alt_text,display_order),product_variants!inner(id,sku,frame_color,lens_color,price_minor,stock_quantity)', { count: 'exact' }).eq('status','published');
  if(params.category){const {data:category}=await db.from('categories').select('id').eq('slug',params.category).eq('active',true).maybeSingle();if(!category)return {products:[] as Product[],count:0,unavailable:false};query=query.eq('category_id',category.id);}
  if(params.collection){const {data:collection}=await db.from('collections').select('id').eq('slug',params.collection).eq('published',true).maybeSingle();if(!collection)return {products:[] as Product[],count:0,unavailable:false};const {data:members}=await db.from('collection_products').select('product_id').eq('collection_id',collection.id);const ids=(members||[]).map(m=>m.product_id);if(!ids.length)return {products:[] as Product[],count:0,unavailable:false};query=query.in('id',ids);}
  if (params.q) {
    const term=params.q.trim().replace(/[^\p{L}\p{N} -]/gu,'').slice(0,80);
    if(term){
      const [{data:skus},{data:collections}]=await Promise.all([
        db.from('product_variants').select('product_id').ilike('sku',`%${term}%`).limit(100),
        db.from('collections').select('id').eq('published',true).ilike('name',`%${term}%`).limit(30),
      ]);
      let ids=(skus||[]).map(item=>item.product_id);
      if(collections?.length){const {data:members}=await db.from('collection_products').select('product_id').in('collection_id',collections.map(item=>item.id)).limit(200);ids=ids.concat((members||[]).map(item=>item.product_id));}
      const unique=Array.from(new Set(ids));
      query=query.or(`name.ilike.%${term}%,description.ilike.%${term}%${unique.length?`,id.in.(${unique.join(',')})`:''}`);
    }
  }
  if(params.shape)query=query.eq('frame_shape',params.shape);
  if(params.material)query=query.eq('material',params.material);
  if(params.frameColor)query=query.eq('product_variants.frame_color',params.frameColor);
  if(params.lensColor)query=query.eq('product_variants.lens_color',params.lensColor);
  if(params.available)query=query.gt('product_variants.stock_quantity',0);
  if(params.minPrice!==undefined)query=query.gte('base_price_minor',params.minPrice);
  if(params.maxPrice!==undefined)query=query.lte('base_price_minor',params.maxPrice);
  if (params.sort === 'price-asc') query = query.order('base_price_minor',{ascending:true});
  else if (params.sort === 'price-desc') query = query.order('base_price_minor',{ascending:false});
  else if (params.sort === 'newest') query = query.order('created_at',{ascending:false});
  else query = query.order('featured_order',{ascending:true,nullsFirst:false}).order('created_at',{ascending:false});
  const { data, count, error } = await query.range((page-1)*12,page*12-1);
  if (error) throw error;
  return { products: (data || []) as Product[], count: count || 0, unavailable: false };
}
export const getProduct = cache(async (idOrSlug: string) => {
  if (!configured) return null;
  const db = await serverDb();
  const lookup=db.from('products').select('id,slug,name,description,base_price_minor,currency,category_id,material,frame_shape,fit,specifications,product_images(storage_path,alt_text,display_order,variant_id),product_variants(id,sku,frame_color,lens_color,price_minor,stock_quantity)').eq('status','published');
  const { data } = await (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)?lookup.eq('id',idOrSlug):lookup.eq('slug',idOrSlug)).maybeSingle();
  return data as Product | null;
});
