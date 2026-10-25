import { AuthComplete } from '@/components/auth-complete';
import { safeAuthNext } from '@/lib/auth-next';

export default async function CompleteSignIn({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const { next } = await searchParams;
  return <AuthComplete next={safeAuthNext(typeof next === 'string' ? next : null)} />;
}
