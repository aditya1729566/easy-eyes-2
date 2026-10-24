import { configured, serverDb } from './supabase';
export async function currentUser() {
  if (!configured) return null;
  const db = await serverDb();
  const { data, error } = await db.auth.getUser();
  return error ? null : data.user;
}
export async function isAdmin() {
  const user = await currentUser();
  if (!user) return false;
  const db = await serverDb();
  const { data } = await db.from('profiles').select('role').eq('id', user.id).single();
  return data?.role === 'admin';
}
