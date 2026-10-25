import 'server-only';
import { privilegedDb } from '@/lib/supabase';

export const studySlugs = ['objects-of-light', 'after-dark', 'new-perspectives', 'optical-studies'] as const;
export const studyPreviewEnabled = process.env.CATALOG_STUDIES_PREVIEW === '1';
const source = 'easy-eyes-120-product-catalog';

export type StudyFrame = {
  id: string;
  slug: string;
  name: string;
  material: string | null;
  shape: string | null;
  type: 'sunglasses' | 'optical';
  image: string;
  imageAlt: string;
};

export function isStudySlug(slug: string): slug is typeof studySlugs[number] {
  return studySlugs.some(value => value === slug);
}

export async function studyCounts(collectionIds: string[]) {
  if (!collectionIds.length) return new Map<string, number>();
  const { data, error } = await privilegedDb().from('collection_products').select('collection_id').in('collection_id', collectionIds);
  if (error) throw error;
  const counts = new Map<string, number>();
  for (const row of data || []) counts.set(row.collection_id, (counts.get(row.collection_id) || 0) + 1);
  return counts;
}

export async function getStudyCollection(slug: string) {
  if (!isStudySlug(slug)) return null;
  const db = privilegedDb();
  const { data: collection, error: collectionError } = await db.from('collections')
    .select('id,slug,name,description,hero_image_path,published')
    .eq('slug', slug).maybeSingle();
  if (collectionError) throw collectionError;
  if (!collection || (!collection.published && !studyPreviewEnabled)) return null;

  const { data: memberships, error: membershipError } = await db.from('collection_products')
    .select('product_id,display_order').eq('collection_id', collection.id).order('display_order');
  if (membershipError) throw membershipError;
  const ids = (memberships || []).map(row => row.product_id);
  if (!ids.length) return { collection, frames: [] as StudyFrame[] };

  const { data: products, error: productError } = await db.from('products')
    .select('id,slug,name,material,frame_shape,status,specifications,product_images(storage_path,alt_text,kind,display_order)')
    .in('id', ids).eq('status', 'draft');
  if (productError) throw productError;
  const byId = new Map((products || []).map(product => [product.id, product]));
  const frames = (memberships || []).flatMap(row => {
    const product = byId.get(row.product_id);
    const details = product?.specifications as { catalog_source?: string; is_demo?: boolean; product_type?: string } | undefined;
    if (!product || details?.catalog_source !== source || details.is_demo !== true) return [];
    const image = product.product_images?.filter(item => item.kind === 'reference')
      .sort((a, b) => a.display_order - b.display_order)[0];
    if (!image?.storage_path?.startsWith('/assets/catalog-reference/')) return [];
    return [{
      id: product.id,
      slug: product.slug,
      name: product.name,
      material: product.material,
      shape: product.frame_shape,
      type: details.product_type === 'optical' ? 'optical' : 'sunglasses',
      image: image.storage_path,
      imageAlt: image.alt_text,
    } satisfies StudyFrame];
  });
  return { collection, frames };
}
