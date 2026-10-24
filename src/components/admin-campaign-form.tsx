'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export type CampaignDraft = { id:string; slug:string; title:string; subtitle:string; image_path:string|null; poster_path:string|null; video_path:string|null; cta_label:string|null; cta_href:string|null; published:boolean; display_order:number };

export function AdminCampaignForm({campaign}:{campaign?:CampaignDraft}) {
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const router=useRouter();
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setMessage('');
    const form=new FormData(event.currentTarget);
    const optional=(key:string)=>String(form.get(key)||'').trim()||null;
    const input={slug:String(form.get('slug')).trim(),title:String(form.get('title')).trim(),subtitle:String(form.get('subtitle')||'').trim(),image_path:optional('image_path'),poster_path:optional('poster_path'),video_path:optional('video_path'),cta_label:optional('cta_label'),cta_href:optional('cta_href'),display_order:Number(form.get('display_order')||0),published:form.get('published')==='on'};
    try{
      const response=await fetch(campaign?`/api/admin/campaigns/${campaign.id}`:'/api/admin/campaigns',{method:campaign?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});
      const payload=await response.json();
      if(!response.ok)throw new Error(payload.error||'Could not save campaign.');
      setMessage(campaign?'Campaign updated.':'Campaign created.');
      if(!campaign)event.currentTarget.reset();
      router.refresh();
    }catch(cause){setMessage(cause instanceof Error?cause.message:'Could not save campaign.');}
    finally{setBusy(false);}
  }
  const fields:[string,string][]=[['slug','Slug'],['title','Title'],['subtitle','Subtitle'],['image_path','Campaign image path'],['poster_path','Poster media path'],['video_path','Video media path'],['cta_label','Link label'],['cta_href','Link path'],['display_order','Display order']];
  return <form className="form" onSubmit={submit}>{fields.map(([key,label])=><div key={key} className="field"><label htmlFor={`${campaign?.id||'new'}-${key}`}>{label}</label><input id={`${campaign?.id||'new'}-${key}`} name={key} defaultValue={campaign?.[key as keyof CampaignDraft]?.toString()||''} required={key==='slug'||key==='title'} type={key==='display_order'?'number':'text'} placeholder={key==='cta_href'?'/shop':undefined}/></div>)}<label><input type="checkbox" name="published" defaultChecked={campaign?.published||false}/> Publish</label><button className="button-dark" disabled={busy}>{busy?'Saving…':campaign?'Save campaign':'Create campaign'}</button><p role="status">{message}</p></form>;
}
