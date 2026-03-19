import { NextResponse } from 'next/server';
import { signIn } from '@/src/lib/auth';

export async function POST(request: Request) {
  const body = await request.json();
  const result = await signIn('credentials', { email: body.email, password: body.password, redirect: false });
  if (result?.error) {
    return NextResponse.json({ message: 'Login fehlgeschlagen.' }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
