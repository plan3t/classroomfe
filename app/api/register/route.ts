import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/src/lib/prisma';
import { signIn } from '@/src/lib/auth';

export async function POST(request: Request) {
  const body = await request.json();
  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) {
    return NextResponse.json({ message: 'E-Mail wird bereits verwendet.' }, { status: 409 });
  }

  await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      passwordHash: await hash(body.password, 10),
    },
  });

  await signIn('credentials', { email: body.email, password: body.password, redirect: false });
  return NextResponse.json({ ok: true });
}
