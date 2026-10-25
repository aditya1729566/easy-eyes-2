'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { browserDb } from '@/lib/supabase-browser';
import { clearCartSnapshot, refreshCartSnapshot } from '@/lib/cart-snapshot';
import { safeAuthNext } from '@/lib/auth-next';

type Mode = 'login' | 'signup' | 'forgot';

function GoogleMark() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" focusable="false">
    <path fill="#4285F4" d="M21.35 12.25c0-.75-.07-1.47-.2-2.16H12v4.09h5.23a4.47 4.47 0 0 1-1.94 2.93v2.42h3.14c1.84-1.7 2.92-4.2 2.92-7.28Z" />
    <path fill="#34A853" d="M12 21.75c2.64 0 4.85-.88 6.47-2.39l-3.14-2.42c-.87.58-1.98.93-3.33.93a5.99 5.99 0 0 1-5.63-4.15H3.14v2.5A9.75 9.75 0 0 0 12 21.75Z" />
    <path fill="#FBBC05" d="M6.37 13.72a5.87 5.87 0 0 1 0-3.44v-2.5H3.14a9.75 9.75 0 0 0 0 8.44l3.23-2.5Z" />
    <path fill="#EA4335" d="M12 6.13c1.44 0 2.72.49 3.74 1.46l2.81-2.81A9.38 9.38 0 0 0 12 2.25a9.75 9.75 0 0 0-8.86 5.53l3.23 2.5A5.99 5.99 0 0 1 12 6.13Z" />
  </svg>;
}

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

  return <div className="page-shell auth-page"><p className="eyebrow">Easy Eyes / Account</p><h1 className="page-title">{mode === 'login' ? 'Welcome back.' : mode === 'signup' ? 'Join Easy Eyes.' : 'Reset password.'}</h1><div className="auth-flow">
    {mode !== 'forgot' && <div className="oauth-entry">
      <button type="button" className="google-sign-in" onClick={() => void signInWithGoogle()} disabled={busy || googleBusy}>
        <span className="google-sign-in-icon"><GoogleMark /></span>
        <span className="google-sign-in-label">{googleBusy ? 'Connecting to Google…' : 'Continue with Google'}</span>
        <ArrowUpRight className="google-sign-in-arrow" size={18} strokeWidth={1.5} aria-hidden="true" />
      </button>
      {googleError && <span role="alert" className="form-error">{googleError}</span>}
      <p className="auth-divider"><span>or use your email</span></p>
    </div>}
    <form className="form" onSubmit={submit}>
    {mode === 'signup' && <div className="field"><label htmlFor="name">Full name</label><input id="name" name="name" autoComplete="name" required /></div>}
    <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
    {mode !== 'forgot' && <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} required /></div>}
    {error && <p role="alert" className="form-error">{error}</p>}
    {success && <p role="status" className="form-success">{success} {mode === 'login' && <Link href="/cart">Go to bag</Link>}</p>}
    <button className="button-dark" disabled={busy}>{busy ? 'Working…' : mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}</button>
    <p className="auth-alt-links">{mode === 'login' ? <><Link href="/signup">Create an account</Link><Link href="/forgot-password">Forgot password?</Link></> : <Link href="/login">Back to sign in</Link>}</p>
    </form>
  </div></div>;
}
