import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
export const ok = (data: unknown, status = 200) => NextResponse.json({ data }, { status });
export const fail = (message: string, status = 400) => NextResponse.json({ error: { message } }, { status });
export function caught(error: unknown) {
  if (error instanceof ZodError) return NextResponse.json({ error: { message: 'Invalid input', issues: error.issues } }, { status: 422 });
  console.error('API error', error);
  return fail('The request could not be completed.', 500);
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  return new URL(origin).host === new URL(request.url).host;
}
