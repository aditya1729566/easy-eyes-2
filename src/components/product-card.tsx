import Link from 'next/link';
import Image from 'next/image';
import { Product, mediaUrl } from '@/lib/catalog';
import { brandAssets } from '@/config/brand-assets';
import { money } from '@/config/site';

export function ProductCard({product,eager=false}:{product:Product;eager?:boolean}) {
  const images=product.product_images?.slice().sort((a,b)=>a.display_order-b.display_order)||[];
  const front=images[0];
  const second=images[1];
  const frontSrc=mediaUrl(front?.storage_path)||brandAssets.productFallback;
  const secondSrc=mediaUrl(second?.storage_path);
  const reference=front?.storage_path?.startsWith('/assets/catalog-reference/');
  return <article className="product-card"><Link href={`/products/${product.slug}`} className={`product-image${reference?' product-image--reference':''}`}>
    <Image src={frontSrc} alt={front?.alt_text||`Illustrative image slot for ${product.name}`} fill sizes="(max-width: 640px) 50vw, (max-width: 1000px) 50vw, 33vw" loading={eager?'eager':'lazy'}/>
    {secondSrc&&<Image className="product-image-secondary" src={secondSrc} alt="" aria-hidden fill sizes="(max-width: 640px) 50vw, (max-width: 1000px) 50vw, 33vw"/>}
    <span className="product-view">View frame <span aria-hidden>↗</span></span>
  </Link><div className="product-caption"><div><h3><Link href={`/products/${product.slug}`}>{product.name}</Link></h3><span>{product.frame_shape||'Eyewear'}</span></div><strong>{money(product.base_price_minor)}</strong></div></article>;
}
