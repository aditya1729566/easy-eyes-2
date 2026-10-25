'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { browserDb } from '@/lib/supabase-browser';
import { clearCartSnapshot, refreshCartSnapshot } from '@/lib/cart-snapshot';
import { safeAuthNext } from '@/lib/auth-next';

type Mode = 'login' | 'signup' | 'forgot';

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState(params.get('oauth_error') ? 'Sign-in could not be completed. Please try again.' : '');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleError, setGoogleError] = useState('');

  async function signInWithGoogle() {
    setGoogleBusy(true);
    setGoogleError('');
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) throw new Error('Google sign-in is unavailable. Please use email.');
      const settingsResponse = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key }, cache: 'no-store' });
      if (!settingsResponse.ok) throw new Error('Google sign-in is unavailable. Please use email.');
      const settings = await settingsResponse.json();
      if (!settings.external?.google) throw new Error('Google sign-in is being set up. Please use email for now.');

      try {
        sessionStorage.setItem('ee_google_next', safeAuthNext(params.get('next')));
      } catch {
        // The default account destination still works without session storage.
      }
      const { error: oauthError } = await browserDb().auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${location.origin}/auth/callback` },
      });
      if (oauthError) throw oauthError;
    } catch (cause) {
      setGoogleError(cause instanceof Error ? cause.message : 'Google sign-in could not start.');
      setGoogleBusy(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email'));
    const password = String(form.get('password'));
    try {
      const db = browserDb();
      if (mode === 'forgot') {
        const result = await db.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/auth/callback?next=/reset-password` });
        if (result.error) throw result.error;
        setSuccess('If the address is registered, a reset link is on its way.');
      } else if (mode === 'signup') {
        const result = await db.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/auth/callback`, data: { full_name: String(form.get('name')) } } });
        if (result.error) throw result.error;
        setSuccess('Check your email to confirm your account.');
      } else {
        const result = await db.auth.signInWithPassword({ email, password });
        if (result.error) throw result.error;
        clearCartSnapshot();
        const merge = await fetch('/api/cart/merge', { method: 'POST' });
        if (merge.ok) {
          const payload = await merge.json();
          const count = payload.data?.conflicts?.length || 0;
          if (count) {
            setSuccess(`${count} bag ${count === 1 ? 'item could' : 'items could'} not be merged because of availability. Review your bag or try again later.`);
            void refreshCartSnapshot().catch(() => {});
            router.refresh();
            return;
          }
        } else {
          setSuccess('Signed in. Your saved bag could not be merged yet; check it before ordering.');
          void refreshCartSnapshot().catch(() => {});
          router.refresh();
          return;
        }
        void refreshCartSnapshot().catch(() => {});
        router.push(safeAuthNext(params.get('next')));
        router.refresh();
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Authentication failed');
    } finally {
      setBusy(false);
    }
  }

  return <div className="page-shell"><p className="eyebrow">Easy Eyes / Account</p><h1 className="page-title">{mode === 'login' ? 'Welcome back.' : mode === 'signup' ? 'Join Easy Eyes.' : 'Reset password.'}</h1><form className="form" onSubmit={submit}>
    {mode === 'signup' && <div className="field"><label htmlFor="name">Full name</label><input id="name" name="name" autoComplete="name" required /></div>}
    <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
    {mode !== 'forgot' && <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} required /></div>}
    {error && <p role="alert" className="form-error">{error}</p>}
    {success && <p role="status" className="form-success">{success} {mode === 'login' && <Link href="/cart">Go to bag</Link>}</p>}
    <button className="button-dark" disabled={busy}>{busy ? 'Working…' : mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}</button>
    <p>{mode === 'login' ? <><Link href="/signup">Create an account</Link> · <Link href="/forgot-password">Forgot password?</Link></> : <Link href="/login">Back to sign in</Link>}</p>
  </form>{mode !== 'forgot' && <div className="oauth-entry"><p>Or continue with</p><button type="button" className="google-sign-in" onClick={() => void signInWithGoogle()} disabled={busy || googleBusy}>{googleBusy ? 'Connecting to Google…' : 'Google'}</button>{googleError && <span role="alert" className="form-error">{googleError}</span>}</div>}</div>;
}
