import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireTeacherSession } from '@/src/lib/session';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireTeacherSession();
  const { id } = await params;
  const game = await prisma.gameSession.findFirst({
    where: { id, teacherId: session.user.id },
    include: { players: { include: { cartLines: true } } },
  });
  if (!game) return NextResponse.json({ message: 'Nicht gefunden.' }, { status: 404 });

  const rows = ['player,done,goals,foodId,variantId,qty'];
  game.players.forEach((p) => {
    if (p.cartLines.length === 0) rows.push(`${p.displayName},${p.done},"${p.goals.join('|')}",,,0`);
    p.cartLines.forEach((line) => {
      rows.push(`${p.displayName},${p.done},"${p.goals.join('|')}",${line.foodId},${line.variantId},${line.qty}`);
    });
  });

  return new NextResponse(rows.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="game-session-${id}.csv"`,
    },
  });
}
