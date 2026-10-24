import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProduct, mediaUrl, Product } from '@/lib/catalog';
import { brandAssets } from '@/config/brand-assets';
import { ProductActions } from '@/components/product-actions';
import { ReviewForm } from '@/components/review-form';
import { ProductGallery } from '@/components/product-gallery';
import { ProductCard } from '@/components/product-card';
import { serverDb } from '@/lib/supabase';
import { site } from '@/config/site';

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params;
  const product=await getProduct(slug);
  if(!product)return {title:'Frame not found'};
  return {title:product.name,description:product.description||`${product.name} from Easy Eyes.`,alternates:{canonical:`/products/${product.slug}`},openGraph:{title:product.name,description:product.description||undefined,url:`/products/${product.slug}`,images:product.product_images?.[0]?.storage_path?[{url:mediaUrl(product.product_images[0].storage_path)!}]:undefined}};
}

export default async function ProductPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const product=await getProduct(slug);
  if(!product)notFound();
  const db=await serverDb();
  const [{data:reviews},{data:related}]=await Promise.all([
    db.from('reviews').select('id,rating,title,body,created_at').eq('product_id',product.id).eq('status','approved').order('created_at',{ascending:false}),
    product.category_id?db.from('products').select('id,slug,name,description,base_price_minor,currency,material,frame_shape,fit,featured_order,product_images(storage_path,alt_text,display_order),product_variants(id,sku,frame_color,lens_color,price_minor,stock_quantity)').eq('category_id',product.category_id).eq('status','published').neq('id',product.id).limit(3):Promise.resolve({data:[]}),
  ]);
  const images=product.product_images?.slice().sort((a,b)=>a.display_order-b.display_order)||[];
  const gallery=images.length?images.map(image=>({src:mediaUrl(image.storage_path)||brandAssets.productFallback,alt:image.alt_text})):[{src:brandAssets.productFallback,alt:`Illustrative image slot for ${product.name}`}];
  const dimensions:[string,string][]=[['frame_width_mm','Frame width'],['lens_width_mm','Lens width'],['bridge_mm','Bridge'],['temple_mm','Temple']];
  const rating=reviews?.length?(reviews.reduce((sum,item)=>sum+item.rating,0)/reviews.length).toFixed(1):null;
  const price=product.product_variants?.length?Math.min(...product.product_variants.map(v=>v.price_minor)):product.base_price_minor;
  const structured={ '@context':'https://schema.org','@type':'Product',name:product.name,description:product.description,sku:product.product_variants?.[0]?.sku,url:`${site.origin}/products/${product.slug}`,...(images[0]?.storage_path?{image:[`${site.origin}${mediaUrl(images[0].storage_path)}`]}:{}),offers:{'@type':'Offer',priceCurrency:'INR',price:(price/100).toFixed(2),availability:product.product_variants?.some(v=>v.stock_quantity>0)?'https://schema.org/InStock':'https://schema.org/OutOfStock',url:`${site.origin}/products/${product.slug}`},...(rating?{aggregateRating:{'@type':'AggregateRating',ratingValue:rating,reviewCount:reviews?.length}}:{})};
  return <div className="page-shell"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structured).replace(/</g,'\\u003c')}}/><div className="pdp"><ProductGallery images={gallery}/><div className="pdp-info"><p className="eyebrow">Easy Eyes / Eyewear</p><h1>{product.name}</h1><p>{product.description}</p><dl><dt>Shape</dt><dd>{product.frame_shape||'—'}</dd><dt>Material</dt><dd>{product.material||'—'}</dd><dt>Fit</dt><dd>{product.fit||'—'}</dd></dl><ProductActions productId={product.id} basePrice={product.base_price_minor} variants={product.product_variants||[]}/><details><summary>Dimensions</summary><dl>{dimensions.map(([key,label])=>typeof product.specifications?.[key]==='number'?<div key={key}><dt>{label}</dt><dd>{String(product.specifications[key])} mm</dd></div>:null)}</dl></details><details><summary>Care and delivery</summary><p>Care instructions and shipping terms will be published with the final product details.</p></details></div></div>
    <section className="reviews-section"><p className="eyebrow">Customer notes</p><h2>Reviews</h2>{rating&&<p>Average rating {rating}/5 from {reviews?.length} verified {reviews?.length===1?'review':'reviews'}.</p>}{reviews?.length?reviews.map(review=><article key={review.id}><strong>{review.rating}/5 — {review.title}</strong><p>{review.body}</p></article>):<p>No published reviews yet.</p>}<h3>Share your view</h3><ReviewForm productId={product.id}/></section>
    {(related?.length??0)>0&&<section className="related-products"><p className="eyebrow">Keep looking</p><h2>Other perspectives.</h2><div className="product-grid">{(related as Product[]).map(item=><ProductCard key={item.id} product={item}/>)}</div></section>}
  </div>;
}
