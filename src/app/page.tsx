import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
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
      <HeroFilms campaign={campaign} />
    </section>

    <ModelGallery />

    {catalog.products.length > 0 && <section id="featured" className="featured section-wrap">
      <div className="section-heading"><p className="eyebrow">The collection</p><h2>Shapes that change <em>the whole picture.</em></h2><Link className="line-link" href="/shop">View all frames <ArrowUpRight size={18} /></Link></div>
      <div className="product-grid">{catalog.products.slice(0, 3).map(product => <ProductCard key={product.id} product={product} />)}</div>
    </section>}
  </>;
}
