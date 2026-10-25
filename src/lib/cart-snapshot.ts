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
const listeners = new Set<() => void>();

export function readCartSnapshot() { return snapshot; }
export function serverCartSnapshot() { return null; }
export function subscribeCartSnapshot(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function writeCartSnapshot(lines: CartLine[]) {
  snapshot = lines;
  listeners.forEach(listener => listener());
}
export function clearCartSnapshot() {
  snapshot = null;
  listeners.forEach(listener => listener());
}
