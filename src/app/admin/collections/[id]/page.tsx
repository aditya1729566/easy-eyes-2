import { notFound } from 'next/navigation';
import { serverDb } from '@/lib/supabase';
import { CollectionAssign } from '@/components/admin-editors';
import { AdminCollectionForm, CollectionDraft } from '@/components/admin-collection-form';

export default async function EditCollection({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const db=await serverDb();
  const [{data,error},{data:products}]=await Promise.all([
    db.from('collections').select('slug,name,description,hero_image_path,published,display_order,collection_products(product_id,display_order,products(name))').eq('id',id).single(),
    db.from('products').select('id,name').neq('status','archived').order('name'),
  ]);
  if(error||!data)notFound();
  return <><p className="eyebrow">Collection / {data.slug}</p><h1 className="page-title">{data.name}</h1><div className="two-col"><section><AdminCollectionForm collection={data as CollectionDraft}/></section><section><h2>Assigned frames</h2><ul>{data.collection_products?.map(row=><li key={row.product_id}>{row.products?.[0]?.name} · Position {row.display_order}</li>)}</ul><CollectionAssign id={id} products={products||[]}/></section></div></>;
}
