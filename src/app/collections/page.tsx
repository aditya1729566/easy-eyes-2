import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { connection } from 'next/server';
import { ArrowUpRight } from 'lucide-react';
import { configured, privilegedDb, serverDb } from '@/lib/supabase';
import { mediaUrl } from '@/lib/catalog';
import { brandAssets } from '@/config/brand-assets';
import { isStudySlug, studyCounts, studyPreviewEnabled } from '@/lib/study-catalog';

export const metadata: Metadata = { title: 'Collections' };

type CollectionRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  hero_image_path: string | null;
  published: boolean;
};

export default async function Collections() {
  await connection();
  let collections: CollectionRow[] = [];
  if (configured) {
    const db = studyPreviewEnabled ? privilegedDb() : await serverDb();
    let query = db.from('collections').select('id,slug,name,description,hero_image_path,published').order('display_order');
    if (!studyPreviewEnabled) query = query.eq('published', true);
    const { data, error } = await query;
    if (error) throw error;
    collections = (data || []).filter(row => row.published || isStudySlug(row.slug));
  }
  const counts = await studyCounts(collections.filter(row => isStudySlug(row.slug)).map(row => row.id));

  return <div className="archive-page page-shell">
    <div className="archive-intro">
      <div><p className="eyebrow">Easy Eyes / The frame archive</p><h1>Four ways to <em>look again.</em></h1></div>
      <div className="archive-intro-side"><strong>{[...counts.values()].reduce((sum, value) => sum + value, 0)}</strong><p>Frame studies across the new collection archive.</p></div>
    </div>

    {collections.length ? <div className="archive-collection-grid">
      {collections.map((collection, index) => {
        const study = isStudySlug(collection.slug);
        const description = study
          ? collection.description.replace(/^Design-study archive:\s*/, '').split(' Reference photographs')[0]
          : collection.description;
        return <Link href={`/collections/${collection.slug}`} className="archive-collection" data-collection={collection.slug} key={collection.id}>
          <div className="archive-collection-image">
            <Image
              src={mediaUrl(collection.hero_image_path) || brandAssets.productFallback}
              alt={study ? `Eyewear reference photograph for ${collection.name}` : collection.name}
              fill
              sizes="(max-width: 700px) 100vw, 50vw"
              loading={index === 0 ? 'eager' : 'lazy'}
            />
          </div>
          <div className="archive-collection-info">
            <span>{String(index + 1).padStart(2, '0')} / {study ? `${counts.get(collection.id) || 0} concepts` : 'Collection'}</span>
            <h2>{collection.name}</h2>
            <p>{description}</p>
            <strong>Explore the collection <ArrowUpRight size={18} /></strong>
          </div>
        </Link>;
      })}
    </div> : <div className="empty-collection"><p>Collections will appear when published.</p><Link className="line-link" href="/shop">Browse all frames</Link></div>}

    <div className="archive-disclosure"><p><strong>Design archive.</strong> These names and specifications are concepts, with no retail stock. The glasses photographs show separate reference frames and do not depict the named concepts.</p><p>Reference imagery: <a href="https://huggingface.co/datasets/shravya11/eyeglasses-dataset">shravya11/eyeglasses-dataset</a> · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. Images are resized for display.</p></div>
  </div>;
}
