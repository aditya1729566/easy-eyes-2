'use client';

export type CartLine = {
  id: string;
  quantity: number;
  product_variants: {
    id: string;
    sku: string;
    frame_color: string;
    lens_color: string;
    price_minor: number;
    stock_quantity: number;
    products: {
      slug: string;
      name: string;
      product_images: { storage_path: string; alt_text: string }[];
    };
  };
};

let snapshot: CartLine[] | null = null;
let revision = 0;
let pendingRefresh: Promise<CartLine[]> | null = null;
const listeners = new Set<() => void>();

export function readCartSnapshot() { return snapshot; }
export function serverCartSnapshot() { return null; }
export function subscribeCartSnapshot(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function writeCartSnapshot(lines: CartLine[]) {
  snapshot = lines;
  revision += 1;
  listeners.forEach(listener => listener());
}
export function clearCartSnapshot() {
  snapshot = null;
  revision += 1;
  pendingRefresh = null;
  listeners.forEach(listener => listener());
}

export function refreshCartSnapshot() {
  if (pendingRefresh) return pendingRefresh;
  const startRevision = revision;
  const refresh = (async () => {
    const response = await fetch('/api/cart', { cache: 'no-store' });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error?.message || 'Bag unavailable');
    const lines = (body.data || []) as CartLine[];
    if (revision === startRevision) writeCartSnapshot(lines);
    return lines;
  })();
  pendingRefresh = refresh;
  void refresh.finally(() => { if (pendingRefresh === refresh) pendingRefresh = null; }).catch(() => {});
  return refresh;
}
