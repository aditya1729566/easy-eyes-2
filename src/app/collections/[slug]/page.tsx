import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { configured, serverDb } from '@/lib/supabase';
import { ProductCard } from '@/components/product-card';
import type { Product } from '@/lib/catalog';
import { getStudyCollection, isStudySlug, type StudyFrame } from '@/lib/study-catalog';
import { brandAssets } from '@/config/brand-assets';

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function frameCard(frame: StudyFrame, index: number) {
  return <article className="archive-frame-card" key={frame.id}>
    <div className="archive-frame-image"><Image src={frame.image} alt={frame.imageAlt} fill sizes="(max-width: 650px) 50vw, (max-width: 1100px) 33vw, 25vw" loading={index < 4 ? 'eager' : 'lazy'} /><span>Reference photo</span></div>
    <div className="archive-frame-meta"><span>{frame.type === 'optical' ? 'Optical study' : 'Sun study'} / {frame.shape || 'Frame'}</span><h3>{frame.name}</h3><p>{frame.material || 'Material study'}</p></div>
  </article>;
}

async function StudyCollection({ slug, searchParams }: { slug: string; searchParams: PageProps['searchParams'] }) {
  const result = await getStudyCollection(slug);
  if (!result) notFound();
  const { collection, frames } = result;
  const params = await searchParams;
  const get = (key: string) => typeof params[key] === 'string' ? String(params[key]) : '';
  const q = get('q').trim().toLowerCase().slice(0, 80);
  const type = get('type');
  const shape = get('shape');
  const shapes = [...new Set(frames.map(frame => frame.shape).filter((value): value is string => Boolean(value)))].sort();
  const filtered = frames.filter(frame =>
    (!q || `${frame.name} ${frame.shape} ${frame.material}`.toLowerCase().includes(q)) &&
    (!type || frame.type === type) &&
    (!shape || frame.shape === shape));
  const pageSize = 24;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(pages, Math.max(1, Number.parseInt(get('page'), 10) || 1));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const pageHref = (next: number) => {
    const query = new URLSearchParams();
    if (q) query.set('q', q);
    if (type) query.set('type', type);
    if (shape) query.set('shape', shape);
    query.set('page', String(next));
    return `/collections/${slug}?${query}`;
  };
  const description = collection.description.replace(/^Design-study archive:\s*/, '').split(' Reference photographs')[0];

  return <div className="archive-detail">
    <section className="archive-detail-hero" data-collection={slug}>
      <div className="archive-detail-copy"><Link href="/collections" className="archive-back"><ArrowLeft size={17} /> All collections</Link><p className="eyebrow">Easy Eyes / Design archive</p><h1>{collection.name}</h1><p>{description}</p><span>{frames.length} frame concepts · no retail stock</span></div>
      <div className="archive-detail-image"><Image src={collection.hero_image_path || frames[0]?.image || brandAssets.productFallback} alt={`Separate eyewear reference photograph for ${collection.name}`} fill sizes="(max-width: 800px) 100vw, 50vw" loading="eager" /></div>
    </section>

    <section className="archive-results section-wrap" aria-labelledby="archive-results-title">
      <div className="archive-results-heading"><div><p className="eyebrow">Explore the studies</p><h2 id="archive-results-title">The frames.</h2></div><p>Reference photos show other glasses. The named frames, measurements and prices are concepts pending verification.</p></div>
      <form className="archive-filters" action={`/collections/${slug}`}>
        <label>Search<input type="search" name="q" defaultValue={get('q')} placeholder="Name, shape or material" /></label>
        <label>Type<select name="type" defaultValue={type}><option value="">All types</option><option value="sunglasses">Sunglasses</option><option value="optical">Optical</option></select></label>
        <label>Shape<select name="shape" defaultValue={shape}><option value="">All shapes</option>{shapes.map(value => <option value={value} key={value}>{value}</option>)}</select></label>
        <button type="submit">Apply filters</button><Link href={`/collections/${slug}`}>Clear</Link>
      </form>
      <p className="archive-result-count">Showing {visible.length} of {filtered.length} matching concepts</p>
      {visible.length ? <div className="archive-frame-grid">{visible.map(frameCard)}</div> : <div className="empty-collection"><p>No concepts match these filters.</p><Link href={`/collections/${slug}`} className="line-link">Clear filters</Link></div>}
      {pages > 1 && <nav className="archive-pagination" aria-label="Collection pages"><span>Page {page} of {pages}</span>{page > 1 && <Link href={pageHref(page - 1)}><ArrowLeft size={17} /> Previous</Link>}{page < pages && <Link href={pageHref(page + 1)}>Next <ArrowRight size={17} /></Link>}</nav>}
      <div className="archive-disclosure"><p><strong>Concept archive.</strong> Entries are drafts with zero stock. Reference photographs are separate eyewear, not images of the named concepts; there is no purchase option.</p><p>Photography: <a href="https://huggingface.co/datasets/shravya11/eyeglasses-dataset">shravya11/eyeglasses-dataset</a> · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. Images are resized for display.</p></div>
    </section>
  </div>;
}

async function StandardCollection({ slug }: { slug: string }) {
  if (!configured) notFound();
  const db = await serverDb();
  const { data } = await db.from('collections').select('name,description,collection_products(products(id,slug,name,description,base_price_minor,currency,material,frame_shape,fit,featured_order,product_images(storage_path,alt_text,display_order)))').eq('slug', slug).eq('published', true).single();
  if (!data) notFound();
  const products = (data.collection_products || []).flatMap(row => row.products || []) as Product[];
  return <div className="page-shell"><p className="eyebrow">Easy Eyes / Collection</p><h1 className="page-title">{data.name}</h1><p className="support-copy">{data.description}</p><hr className="thin-rule"/><div className="product-grid">{products.map(product => <ProductCard key={product.id} product={product} />)}</div>{!products.length && <p>There are no published frames in this collection yet.</p>}</div>;
}

export default async function Collection({ params, searchParams }: PageProps) {
  const { slug } = await params;
  return isStudySlug(slug) ? <StudyCollection slug={slug} searchParams={searchParams} /> : <StandardCollection slug={slug} />;
}
