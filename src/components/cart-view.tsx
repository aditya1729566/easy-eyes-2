'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { money } from '@/config/site';
import { brandAssets } from '@/config/brand-assets';
import { readCartSnapshot, serverCartSnapshot, subscribeCartSnapshot, writeCartSnapshot } from '@/lib/cart-snapshot';

function imageUrl(path?: string) {
  if (!path) return brandAssets.productFallback;
  if (path.startsWith('/')) return path;
  return `/api/media/catalog/${path.split('/').map(encodeURIComponent).join('/')}`;
}

export function CartView() {
  const snapshot = useSyncExternalStore(subscribeCartSnapshot, readCartSnapshot, serverCartSnapshot);
  const lines = snapshot || [];
  const [fetchDone, setFetchDone] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const snapshotAtStart = readCartSnapshot();
    fetch('/api/cart', { signal: controller.signal })
      .then(async response => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error?.message || 'Bag unavailable');
        const fresh = body.data || [];
        if (readCartSnapshot() === snapshotAtStart) writeCartSnapshot(fresh);
      })
      .catch(error => { if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : 'Bag unavailable'); })
      .finally(() => { if (!controller.signal.aborted) setFetchDone(true); });
    return () => controller.abort();
  }, []);

  async function change(id: string, quantity: number) {
    if (busyId) return;
    const previous = lines;
    const optimistic = quantity
      ? lines.map(line => line.id === id ? { ...line, quantity } : line)
      : lines.filter(line => line.id !== id);
    writeCartSnapshot(optimistic);
    setBusyId(id);
    setMessage('');
    try {
      const response = await fetch(`/api/cart/items/${id}`, {
        method: quantity ? 'PATCH' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: quantity ? JSON.stringify({ quantity }) : undefined,
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message || 'Could not update bag');
      const fresh = body.data || [];
      writeCartSnapshot(fresh);
      setMessage('Bag updated.');
    } catch (error) {
      writeCartSnapshot(previous);
      setMessage(error instanceof Error ? error.message : 'Could not update bag');
    } finally {
      setBusyId(null);
    }
  }

  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.product_variants.price_minor, 0);
  const loading = snapshot === null && !fetchDone;
  return <div className="page-shell">
    <p className="eyebrow">Your selection</p><h1 className="page-title">The bag</h1>
    {loading ? <p>Loading your bag…</p> : !lines.length ? <div className="empty-collection"><p>Your bag is empty.</p><Link href="/shop" className="line-link">Browse frames →</Link></div> : <>
      <div>{lines.map(line => {
        const product = line.product_variants.products;
        const image = product.product_images?.[0];
        return <div className="bag-line" key={line.id}>
          <Image src={imageUrl(image?.storage_path)} alt={image?.alt_text || `${product.name} frame`} width={105} height={115} />
          <div><Link href={`/products/${product.slug}`}><strong>{product.name}</strong></Link>
            <p className="muted">{line.product_variants.frame_color} / {line.product_variants.lens_color}</p>
            <label>Quantity <select value={line.quantity} disabled={busyId !== null} onChange={event => void change(line.id, Number(event.target.value))}>{Array.from({ length: Math.min(20, line.product_variants.stock_quantity) }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select></label>
            <button type="button" disabled={busyId !== null} onClick={() => void change(line.id, 0)}>Remove</button>
          </div>
          <strong>{money(line.quantity * line.product_variants.price_minor)}</strong>
        </div>;
      })}</div>
      <div className="bag-summary"><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div><p className="muted">Shipping is calculated at checkout. Payment will not be collected online.</p><Link href="/checkout" className="button-dark">Continue to order →</Link></div>
    </>}
    <p role="status">{message}</p>
  </div>;
}
