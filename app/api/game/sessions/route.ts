import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireTeacherSession } from '@/src/lib/session';

export async function GET(request: NextRequest) {
  const session = await requireTeacherSession();
  const id = request.nextUrl.searchParams.get('id');
  if (id) {
    const gameSession = await prisma.gameSession.findFirst({
      where: { id, teacherId: session.user.id },
      include: { players: { include: { cartLines: true } } },
    });
    if (!gameSession) return NextResponse.json({ message: 'Session nicht gefunden.' }, { status: 404 });
    return NextResponse.json({ session: gameSession });
  }
  const sessions = await prisma.gameSession.findMany({
    where: { teacherId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: { players: { include: { cartLines: true } } },
  });
  return NextResponse.json({ sessions });
}

export async function POST(request: NextRequest) {
  const session = await requireTeacherSession();
  const body = (await request.json()) as Partial<{ id: string; mode: 'normal' | 'with-goals'; players: Array<{ id: string; name: string; goals: string[]; done: boolean; cart: Array<{ foodId: string; variantId: string; qty: number }> }>; notes?: string }>;
  if (!body.id || !body.mode || !Array.isArray(body.players)) {
    return NextResponse.json({ message: 'Ungültige Daten.' }, { status: 400 });
  }
  const created = await prisma.gameSession.create({
    data: {
      id: body.id,
      teacherId: session.user.id,
      mode: body.mode === 'with-goals' ? 'WITH_GOALS' : 'NORMAL',
      notes: body.notes,
      players: {
        create: body.players.map((player) => ({
          displayName: player.name,
          goals: player.goals,
          done: player.done,
          cartLines: { create: player.cart.map((line) => ({ foodId: line.foodId, variantId: line.variantId, qty: line.qty })) },
        })),
      },
    },
    include: { players: { include: { cartLines: true } } },
  });
  return NextResponse.json({ session: created }, { status: 201 });
}
