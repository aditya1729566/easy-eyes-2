import type { MetadataRoute } from 'next';
import { site } from '@/config/site';
import { configured, serverDb } from '@/lib/supabase';

export default async function sitemap():Promise<MetadataRoute.Sitemap> {
  if(process.env.NEXT_PUBLIC_SITE_READY!=='true')return [];
  const paths=['/','/shop','/sunglasses','/collections','/about'];
  if(configured){
    const db=await serverDb();
    const [{data:products},{data:collections}]=await Promise.all([
      db.from('products').select('slug').eq('status','published'),
      db.from('collections').select('slug').eq('published',true),
    ]);
    paths.push(...(products||[]).map(item=>`/products/${item.slug}`),...(collections||[]).map(item=>`/collections/${item.slug}`));
  }
  return paths.map(path=>({url:`${site.origin}${path}`,lastModified:new Date()}));
}
