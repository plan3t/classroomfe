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

  const html = `<!doctype html>
<html><head><meta charset="utf-8"/><title>Game Report ${id}</title>
<style>body{font-family:Arial,sans-serif;padding:24px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px;text-align:left}h1{margin-bottom:4px}.muted{color:#666;font-size:12px}</style>
</head><body>
<h1>Spielbericht ${id}</h1>
<p class="muted">Modus: ${game.mode} · Erstellt: ${game.createdAt.toISOString()}</p>
<table><thead><tr><th>Spieler</th><th>Ziele</th><th>Fertig</th><th>Positionen</th></tr></thead><tbody>
${game.players.map((p) => `<tr><td>${p.displayName}</td><td>${p.goals.join(', ') || '-'}</td><td>${p.done ? 'ja' : 'nein'}</td><td>${p.cartLines.length}</td></tr>`).join('')}
</tbody></table>
<script>window.onload=()=>window.print()</script>
</body></html>`;

  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
