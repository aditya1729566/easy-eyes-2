import Link from 'next/link';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { ProductCard } from '@/components/product-card';
import { ModelGallery } from '@/components/model-gallery';
import { HeroFilms } from '@/components/hero-films';
import { listProducts } from '@/lib/catalog';
import { configured, serverDb } from '@/lib/supabase';

type Campaign = { title: string; subtitle: string; cta_href: string | null; cta_label: string | null };

export default async function Home() {
  const catalog = await listProducts();
  let campaign: Campaign | null = null;
  if (configured) {
    const db = await serverDb();
    const result = await db.from('campaigns').select('title,subtitle,cta_href,cta_label').eq('published', true).order('display_order').limit(1).maybeSingle();
    campaign = result.data;
  }
  return <>
    <section className="hero" aria-labelledby="hero-title">
      <HeroFilms />
      <div className="hero-copy">
        <div className="eyebrow light">EASY EYES / UNAPOLOGETIC EYEWEAR</div>
        <h1 id="hero-title">Look<br /><em>closer.</em></h1>
        <p>{campaign?.subtitle || 'Frames for the ones who never look away.'}</p>
        <Link href={campaign?.cta_href || '#the-looks'} className="line-link light">{campaign?.cta_label || 'Explore the looks'} <ArrowUpRight size={18} /></Link>
      </div>
      <div className="hero-bottom"><span>{campaign ? 'Current campaign' : 'For the ones who look back'}</span><a href="#the-looks" aria-label="Scroll to the looks"><ArrowDownRight size={25} /></a></div>
    </section>

    <ModelGallery />

    {catalog.products.length > 0 && <section id="featured" className="featured section-wrap">
      <div className="section-heading"><p className="eyebrow">The collection</p><h2>Made to be seen. <em>Never ignored.</em></h2><Link className="line-link" href="/shop">View all frames <ArrowUpRight size={18} /></Link></div>
      <div className="product-grid">{catalog.products.slice(0, 3).map(product => <ProductCard key={product.id} product={product} />)}</div>
    </section>}
  </>;
}
