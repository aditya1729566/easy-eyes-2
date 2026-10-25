'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { money } from '@/config/site';
import { writeCartSnapshot } from '@/lib/cart-snapshot';

type Variant={id:string;sku:string;frame_color:string;lens_color:string;price_minor:number;stock_quantity:number};

export function ProductActions({productId,basePrice,variants}:{productId:string;basePrice:number;variants:Variant[]}){
  const [variant,setVariant]=useState(variants[0]?.id||'');
  const [quantity,setQuantity]=useState(1);
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const router=useRouter();
  const active=variants.find(v=>v.id===variant);
  async function add(){
    setBusy(true);setMessage('');
    try{
      const res=await fetch('/api/cart/items',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({variant_id:variant,quantity})});
      const body=await res.json();
      if(!res.ok)throw new Error(body.error?.message||'Could not add frame');
      writeCartSnapshot(body.data||[]);
      setMessage('Added to bag.');
    }catch(cause){setMessage(cause instanceof Error?cause.message:'Could not add frame');}
    finally{setBusy(false);}
  }
  async function save(){
    try{
      const res=await fetch('/api/wishlist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({product_id:productId})});
      if(res.status===401){router.push('/login?next=/wishlist');return;}
      if(!res.ok)throw new Error();
      setMessage('Saved to your wishlist.');
    }catch{setMessage('Could not save this frame.');}
  }
  return <div className="pdp-actions"><p className="price">{money(active?.price_minor??basePrice)}</p>{active&&<p className="muted">SKU {active.sku} · {active.stock_quantity?`${active.stock_quantity} available`:'Sold out'}</p>}
    {variants.length>1&&<div className="field"><label htmlFor="variant">Frame and lens</label><select id="variant" value={variant} onChange={event=>{setVariant(event.target.value);setQuantity(1);}}>{variants.map(v=><option key={v.id} value={v.id}>{v.frame_color} / {v.lens_color} — {v.stock_quantity?'In stock':'Sold out'}</option>)}</select></div>}
    <div className="field"><label htmlFor="quantity">Quantity</label><input id="quantity" type="number" min="1" max={Math.min(20,active?.stock_quantity||1)} value={quantity} onChange={event=>setQuantity(Number(event.target.value))}/></div>
    <button type="button" className="button-dark" onClick={add} disabled={busy||!active||active.stock_quantity<quantity||quantity<1}>{busy?'Adding…':active?.stock_quantity?'Add to bag':'Out of stock'}</button>
    <button type="button" className="line-link" onClick={save}>Save this frame</button><p role="status">{message} {message==='Added to bag.'&&<Link href="/cart">View bag →</Link>}</p>
  </div>;
}
