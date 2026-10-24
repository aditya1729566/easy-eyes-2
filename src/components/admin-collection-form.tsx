'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export type CollectionDraft={slug:string;name:string;description:string;hero_image_path:string|null;published:boolean;display_order:number};

export function AdminCollectionForm({collection}:{collection?:CollectionDraft}) {
  const router=useRouter();
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setMessage('');
    const f=new FormData(event.currentTarget);
    const input={slug:String(f.get('slug')||collection?.slug||'').trim(),name:String(f.get('name')).trim(),description:String(f.get('description')||'').trim(),hero_image_path:String(f.get('hero_image_path')||'').trim()||null,published:f.get('published')==='on',display_order:Number(f.get('display_order')||0)};
    try{
      const response=await fetch(collection?`/api/collections/${collection.slug}`:'/api/collections',{method:collection?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});
      const payload=await response.json();
      if(!response.ok)throw new Error(payload.error?.message||'Could not save collection.');
      setMessage(collection?'Collection updated.':'Collection created.');
      if(!collection)event.currentTarget.reset();
      router.refresh();
    }catch(cause){setMessage(cause instanceof Error?cause.message:'Could not save collection.');}
    finally{setBusy(false);}
  }
  return <form className="form" onSubmit={submit}><h2>{collection?'Edit collection':'New collection'}</h2>
    {!collection&&<div className="field"><label htmlFor="collection-slug">Slug</label><input id="collection-slug" name="slug" pattern="[a-z0-9-]+" required/></div>}
    <div className="field"><label htmlFor="collection-name">Name</label><input id="collection-name" name="name" defaultValue={collection?.name||''} required/></div>
    <div className="field"><label htmlFor="collection-description">Description</label><textarea id="collection-description" name="description" defaultValue={collection?.description||''}/></div>
    <div className="field"><label htmlFor="collection-hero">Hero media path</label><input id="collection-hero" name="hero_image_path" defaultValue={collection?.hero_image_path||''}/></div>
    <div className="field"><label htmlFor="collection-order">Display order</label><input id="collection-order" name="display_order" type="number" defaultValue={collection?.display_order||0}/></div>
    <label><input type="checkbox" name="published" defaultChecked={collection?.published||false}/> Publish</label>
    <button className="button-dark" disabled={busy}>{busy?'Saving…':collection?'Save collection':'Create collection'}</button><p role="status">{message}</p>
  </form>;
}
