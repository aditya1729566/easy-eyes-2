import Link from 'next/link';
import { ProductCard } from './product-card';
import { filterOptions, listProducts } from '@/lib/catalog';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function CatalogList({ title, category, searchParams }: { title: string; category?: string; searchParams: SearchParams }) {
  const params = await searchParams;
  const get = (key: string) => typeof params[key] === 'string' ? params[key] as string : undefined;
  const price = (key: string) => { const value = Number(get(key)); return Number.isFinite(value) && value >= 0 ? Math.round(value * 100) : undefined; };
  const requestedPage = Number(get('page') || 1);
  const page = Number.isFinite(requestedPage) ? Math.max(1, Math.floor(requestedPage)) : 1;
  const filters = {
    q: get('q'), sort: get('sort'), page, category, shape: get('shape'), material: get('material'),
    frameColor: get('frame'), lensColor: get('lens'), available: get('available') === 'true',
    minPrice: get('min') ? price('min') : undefined,
    maxPrice: get('max') ? price('max') : undefined,
  };
  const [options, catalog] = await Promise.all([filterOptions(), listProducts(filters)]);
  const pathname = category ? '/sunglasses' : title === 'Find a frame' ? '/search' : '/shop';
  const select = (name: string, label: string, values: string[]) => values.length > 1
    ? <label className="filter-label">{label}<select name={name} defaultValue={get(name) || ''}><option value="">All</option>{values.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
    : null;
  const pageHref = (next: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (key !== 'page' && typeof value === 'string' && value) query.set(key, value);
    query.set('page', String(next));
    return `${pathname}?${query}`;
  };
  const pages = Math.max(1, Math.ceil(catalog.count / 12));
  const hasReferenceImages = catalog.products.some(product => product.product_images?.some(image => image.storage_path.startsWith('/assets/catalog-reference/')));

  return <div className="page-shell">
    <p className="eyebrow">Easy Eyes / The frames</p><h1 className="page-title">{title}</h1>
    <form className="catalog-filters" action={pathname}>
      <div className="field"><label htmlFor="catalog-q">Search</label><input id="catalog-q" className="search-input" type="search" name="q" defaultValue={filters.q} placeholder="Name or detail" /></div>
      {select('shape', 'Shape', options.shapes)}{select('material', 'Material', options.materials)}
      {select('frame', 'Frame colour', options.frameColors)}{select('lens', 'Lens colour', options.lensColors)}
      <label className="filter-label">Sort<select name="sort" defaultValue={filters.sort || 'featured'}><option value="featured">Featured</option><option value="newest">Newest</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option></select></label>
      <div className="field price-filter"><label htmlFor="min">Min ₹</label><input id="min" name="min" type="number" min="0" defaultValue={get('min') || ''} /></div>
      <div className="field price-filter"><label htmlFor="max">Max ₹</label><input id="max" name="max" type="number" min="0" defaultValue={get('max') || ''} /></div>
      <label className="stock-filter"><input type="checkbox" name="available" value="true" defaultChecked={filters.available} /> In stock</label>
      <button className="button-dark" type="submit">Apply filters</button><Link href={pathname} className="line-link">Clear</Link>
    </form>
    <p className="eyebrow">{catalog.count} frames</p>
    {catalog.products.length ? <div className="product-grid">{catalog.products.map((product, index) => <ProductCard key={product.id} product={product} eager={index === 0} />)}</div> : <div className="empty-collection"><p>{catalog.unavailable ? 'Connect the catalog to begin.' : 'No frames match this view.'}</p><Link className="line-link" href={pathname}>Clear filters →</Link></div>}
    {catalog.count > 12 && <nav className="catalog-pagination" aria-label="Catalog pages"><span>Page {page} of {pages}</span>{page > 1 && <Link href={pageHref(page - 1)}>← Previous</Link>}{page < pages && <Link href={pageHref(page + 1)}>Next →</Link>}</nav>}
    {hasReferenceImages && <p className="reference-credit">Glasses photography is used as a visual reference. Source: <a href="https://huggingface.co/datasets/shravya11/eyeglasses-dataset">eyeglasses-dataset</a> · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>.</p>}
  </div>;
}
