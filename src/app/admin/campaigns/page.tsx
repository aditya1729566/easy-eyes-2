import { serverDb } from '@/lib/supabase';
import { AdminCampaignForm, CampaignDraft } from '@/components/admin-campaign-form';

export default async function Campaigns() {
  const db=await serverDb();
  const {data,error}=await db.from('campaigns').select('id,slug,title,subtitle,image_path,poster_path,video_path,cta_label,cta_href,published,display_order').order('display_order');
  if(error)throw error;
  return <><p className="eyebrow">Editorial</p><h1 className="page-title">Campaigns</h1><div className="two-col"><section><h2>Current campaigns</h2>{data?.length?<div className="admin-edit-list">{data.map(c=><details key={c.id}><summary>{c.title}<span>{c.published?'Published':'Draft'}</span></summary><AdminCampaignForm campaign={c as CampaignDraft}/></details>)}</div>:<p className="muted">No campaigns yet.</p>}</section><section><h2>New campaign</h2><AdminCampaignForm/></section></div></>;
}
