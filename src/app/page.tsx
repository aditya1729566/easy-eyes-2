import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { cache, Suspense } from 'react';
import { ProductCard } from '@/components/product-card';
import { ModelGallery } from '@/components/model-gallery';
import { HeroFilms } from '@/components/hero-films';
import { listProducts } from '@/lib/catalog';
import { configured, serverDb } from '@/lib/supabase';

type Campaign = { title: string; subtitle: string; cta_href: string | null; cta_label: string | null };

const loadCampaign = cache(async (): Promise<Campaign | null> => {
  if (!configured) return null;
  const db = await serverDb();
  const { data } = await db.from('campaigns').select('title,subtitle,cta_href,cta_label').eq('published', true).order('display_order').limit(1).maybeSingle();
  return data;
});

function CampaignTitleContent({ campaign }: { campaign: Campaign | null }) {
  return <>
    <span className="eyebrow">{campaign?.title || 'Easy Eyes / Film series'}</span>
    <h1 id="hero-title">Look closer<span>.</span></h1>
  </>;
}

function CampaignActionContent({ campaign }: { campaign: Campaign | null }) {
  return <>
    <p>{campaign?.subtitle || 'A new point of view, in motion.'}</p>
    <Link href={campaign?.cta_href || '#the-looks'} className="line-link">{campaign?.cta_label || 'Explore the looks'} <ArrowUpRight size={18} /></Link>
  </>;
}

async function CampaignTitle() {
  return <CampaignTitleContent campaign={await loadCampaign()} />;
}

async function CampaignAction() {
  return <CampaignActionContent campaign={await loadCampaign()} />;
}

async function FeaturedProducts() {
  const catalog = await listProducts();
  if (!catalog.products.length) return null;
  return <section id="featured" className="featured section-wrap">
    <div className="section-heading"><p className="eyebrow">The collection</p><h2>Frames worth<br />a <em>second look.</em></h2><Link className="line-link" href="/shop">View all frames <ArrowUpRight size={18} /></Link></div>
    <div className="product-grid">{catalog.products.slice(0, 3).map(product => <ProductCard key={product.id} product={product} />)}</div>
  </section>;
}

export default function Home() {
  return <>
    <link rel="preload" href="/assets/campaign/film-01-poster.webp" as="image" fetchPriority="high" />
    <section className="hero" aria-labelledby="hero-title">
      <HeroFilms
        railTitle={<Suspense fallback={<CampaignTitleContent campaign={null} />}><CampaignTitle /></Suspense>}
        railAction={<Suspense fallback={<CampaignActionContent campaign={null} />}><CampaignAction /></Suspense>}
      />
    </section>

    <ModelGallery />

    <Suspense fallback={null}><FeaturedProducts /></Suspense>
  </>;
}
