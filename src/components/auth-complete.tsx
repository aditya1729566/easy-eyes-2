'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { safeAuthNext } from '@/lib/auth-next';
import { clearCartSnapshot, refreshCartSnapshot } from '@/lib/cart-snapshot';

export function AuthComplete({ next }: { next: string }) {
  const router = useRouter();
  const started = useRef(false);
  const [issue, setIssue] = useState('');
  const [destination, setDestination] = useState(next);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    let stored: string | null = null;
    try {
      stored = sessionStorage.getItem('ee_google_next');
      sessionStorage.removeItem('ee_google_next');
    } catch {
      // Sign-in can still finish when the browser blocks session storage.
    }
    const target = safeAuthNext(stored || next);
    clearCartSnapshot();

    void (async () => {
      try {
        const response = await fetch('/api/cart/merge', { method: 'POST' });
        if (response.status === 401) {
          router.replace('/login?oauth_error=1');
          return;
        }
        const body = await response.json();
        if (!response.ok || body.data?.conflicts?.length) {
          setDestination(target);
          setIssue('You are signed in, but some bag items need your attention. Review your bag before ordering.');
          return;
        }
        void refreshCartSnapshot().catch(() => {});
        router.replace(target);
      } catch {
        setDestination(target);
        setIssue('You are signed in, but your bag could not be checked. Review it before ordering.');
      }
    })();
  }, [next, router]);

  return <div className="page-shell status-page">
    <p className="eyebrow">Easy Eyes / Account</p>
    <h1 className="page-title">Signing you in.</h1>
    {issue ? <><p role="alert">{issue}</p><Link className="button-dark" href="/cart">Review bag →</Link><Link className="line-link" href={destination}>Continue →</Link></> : <p role="status">Updating your account and bag…</p>}
  </div>;
}
