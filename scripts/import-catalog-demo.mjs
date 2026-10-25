import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const products = JSON.parse(await readFile('data/catalog-demo.json', 'utf8'));
const manifest = JSON.parse(await readFile('data/catalog-reference-manifest.json', 'utf8'));
const images = new Map(manifest.images.map(image => [image.slug, image]));
const collectionDetails = [
  { slug: 'objects-of-light', name: 'Objects of Light', description: 'Reflective lines, lucid colour and frames made to catch the eye.' },
  { slug: 'after-dark', name: 'After Dark', description: 'Darker lenses, harder edges and an instinct for the unexpected.' },
  { slug: 'new-perspectives', name: 'New Perspectives', description: 'Unfamiliar shapes and new ways of looking at everyday eyewear.' },
  { slug: 'optical-studies', name: 'Optical Studies', description: 'An evolving archive of optical and crossover frame concepts.' },
];
const slugify = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

if (products.length !== 120 || images.size !== 120 ||
  new Set(products.map(item => item.slug)).size !== 120 ||
  products.some(item => item.status !== 'draft' || item.stock !== 0 || item.is_demo !== true || !images.has(item.slug) || !collectionDetails.some(collection => collection.slug === slugify(item.collection)))) {
  throw new Error('Catalog validation failed; refusing to import.');
}

const prepare = process.argv.includes('--prepare');
const publish = process.argv.includes('--publish');
if (prepare === publish) {
  console.log(`Catalog: ${products.length} draft concepts, ${collectionDetails.length} collections, ${images.size} separate glasses reference photos. Use --prepare to import hidden collections, then --publish after deploying their images and pages.`);
  process.exit(0);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !secret) throw new Error('Local Supabase URL and server key are required.');
const db = createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });

function checked(result, operation) {
  if (result.error) throw new Error(`${operation}: ${result.error.message}`);
  return result.data;
}

if (publish) {
  const rows = checked(await db.from('collections').select('id,slug').in('slug', collectionDetails.map(item => item.slug)), 'Read collections');
  if (rows.length !== 4) throw new Error('Expected all four collections before publishing.');
  const memberships = checked(await db.from('collection_products').select('collection_id').in('collection_id', rows.map(item => item.id)), 'Read memberships');
  if (memberships.length !== 120) throw new Error(`Expected 120 collection memberships; found ${memberships.length}.`);
  checked(await db.from('collections').update({ published: true }).in('id', rows.map(item => item.id)), 'Publish collections');
  console.log('Published four design-study collections.');
  process.exit(0);
}

const slugs = products.map(item => item.slug);
const existing = checked(await db.from('products').select('slug,status,specifications').in('slug', slugs), 'Check product collisions');
if (existing.some(item => item.status !== 'draft' || item.specifications?.catalog_source !== 'easy-eyes-120-product-catalog')) {
  throw new Error('A source slug belongs to another product; refusing to replace it.');
}
const existingCollections = checked(await db.from('collections').select('slug,description').in('slug', collectionDetails.map(item => item.slug)), 'Check collection collisions');
if (existingCollections.some(item => !item.description.startsWith('Design-study archive:'))) {
  throw new Error('A source collection slug belongs to another collection; refusing to replace it.');
}

const categories = checked(await db.from('categories').select('id,slug').in('slug', ['sunglasses', 'optical']), 'Read categories');
for (const slug of ['sunglasses', 'optical']) {
  if (categories.some(item => item.slug === slug)) continue;
  const added = checked(await db.from('categories').insert({ slug, name: slug === 'optical' ? 'Optical' : 'Sunglasses', description: 'Eyewear studies', active: true }).select('id,slug').single(), `Create ${slug} category`);
  categories.push(added);
}
const categoryIds = new Map(categories.map(item => [item.slug, item.id]));

const collectionRows = collectionDetails.map((item, index) => {
  const first = products.find(product => slugify(product.collection) === item.slug);
  return {
    slug: item.slug,
    name: item.name,
    description: `Design-study archive: ${item.description} Reference photographs show separate eyewear, not the named concepts.`,
    hero_image_path: images.get(first.slug).localPath,
    published: false,
    display_order: index + 1,
  };
});
const collections = checked(await db.from('collections').upsert(collectionRows, { onConflict: 'slug' }).select('id,slug'), 'Import collections');
const collectionIds = new Map(collections.map(item => [item.slug, item.id]));

const rows = products.map(item => ({
  slug: item.slug,
  name: item.name,
  description: item.description,
  category_id: categoryIds.get(item.product_type === 'optical' ? 'optical' : 'sunglasses'),
  base_price_minor: item.price_paise,
  material: item.material,
  frame_shape: item.shape,
  fit: item.frame_style,
  specifications: {
    catalog_source: 'easy-eyes-120-product-catalog',
    is_demo: true,
    image_is_reference: true,
    original_sku: item.sku,
    product_type: item.product_type,
    lens_width_mm: item.lens_width_mm,
    bridge_width_mm: item.bridge_width_mm,
    temple_length_mm: item.temple_length_mm,
    frame_width_mm: item.frame_width_mm,
    tags: item.tags,
  },
  status: 'draft',
  featured_order: item.id,
}));
const imported = checked(await db.from('products').upsert(rows, { onConflict: 'slug' }).select('id,slug'), 'Import draft products');
if (imported.length !== 120) throw new Error(`Only ${imported.length} products returned.`);
const productIds = new Map(imported.map(item => [item.slug, item.id]));

const variants = products.map(item => ({
  product_id: productIds.get(item.slug),
  sku: `${item.sku}-STD`,
  frame_color: item.frame_color,
  lens_color: item.lens_color,
  price_minor: item.price_paise,
  stock_quantity: 0,
  active: false,
}));
checked(await db.from('product_variants').upsert(variants, { onConflict: 'sku' }), 'Import inactive variants');

const currentImages = checked(await db.from('product_images').select('product_id,storage_path').in('product_id', [...productIds.values()]), 'Read existing images');
const seenImages = new Set(currentImages.map(item => `${item.product_id}:${item.storage_path}`));
const newImages = products.flatMap(item => {
  const image = images.get(item.slug);
  const productId = productIds.get(item.slug);
  if (seenImages.has(`${productId}:${image.localPath}`)) return [];
  return [{
    product_id: productId,
    storage_path: image.localPath,
    alt_text: `Separate ${item.product_type === 'optical' ? 'optical frame' : 'sunglasses'} reference photograph; not the ${item.name} concept`,
    kind: 'reference',
    display_order: 0,
  }];
});
if (newImages.length) checked(await db.from('product_images').insert(newImages), 'Import glasses reference images');

const memberships = products.map(item => ({
  collection_id: collectionIds.get(slugify(item.collection)),
  product_id: productIds.get(item.slug),
  display_order: item.id,
}));
checked(await db.from('collection_products').upsert(memberships, { onConflict: 'collection_id,product_id' }), 'Import collection memberships');

console.log(`Prepared ${collections.length} hidden concept collections, ${imported.length} draft products, ${variants.length} inactive zero-stock variants and ${newImages.length} new reference images.`);
