'use client';

import { useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { readCartSnapshot, refreshCartSnapshot, serverCartSnapshot, subscribeCartSnapshot } from '@/lib/cart-snapshot';

export function CartCount() {
  const lines = useSyncExternalStore(subscribeCartSnapshot, readCartSnapshot, serverCartSnapshot);
  const count = lines?.reduce((sum, line) => sum + line.quantity, 0) || 0;

  useEffect(() => { void refreshCartSnapshot().catch(() => {}); }, []);

  return <Link href="/cart" className="bag-link" aria-label={`Bag, ${count} ${count === 1 ? 'item' : 'items'}`}>
    <ShoppingBag size={20} strokeWidth={1.6} aria-hidden="true" />
    {count > 0 && <span key={count} className="bag-count" aria-hidden="true">{count > 99 ? '99+' : count}</span>}
  </Link>;
}
