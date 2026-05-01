import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { expireRoomsForTeacher } from '@/src/lib/room-service';
import { RoomCreator } from '@/src/components/room-creator';
import { Card, Input, Select } from '@/src/components/ui';
import { formatLanguage } from '@/src/lib/utils';
import type { Prisma } from '@prisma/client';
import type { LanguageCode, RoomStatusCode } from '@/src/lib/contracts';

type DashboardRoom = {
  id: string;
  joinId: string;
  language: LanguageCode;
  status: RoomStatusCode;
  expiresAt: Date;
  updatedAt: Date;
  participants: Array<{ id: string; status: 'WAITING' | 'ACTIVE' | 'COMPLETED' }>;
};

type DashboardSearchParams = Promise<{
  status?: RoomStatusCode | 'ALL';
  query?: string;
  sort?: 'created-desc' | 'updated-desc' | 'expires-asc' | 'participants-desc';
}>;

export default async function DashboardPage({ searchParams }: { searchParams: DashboardSearchParams }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { status = 'ALL', query = '', sort = 'created-desc' } = await searchParams;

  await expireRoomsForTeacher(session.user.id);

  const orderBy: Prisma.RoomOrderByWithRelationInput = {
    ...(sort === 'updated-desc' ? { updatedAt: 'desc' } : sort === 'expires-asc' ? { expiresAt: 'asc' } : { createdAt: 'desc' }),
  };

  const rooms = (await prisma.room.findMany({
    where: {
      teacherId: session.user.id,
      ...(status !== 'ALL' ? { status } : {}),
      ...(query ? { joinId: { contains: query } } : {}),
    },
    include: { participants: true },
    orderBy,
  })) as DashboardRoom[];

  const sortedRooms = sort === 'participants-desc'
    ? [...rooms].sort((left, right) => right.participants.length - left.participants.length)
    : rooms;
  const gameSessions = await prisma.gameSession.findMany({
    where: { teacherId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { players: { include: { cartLines: true } } },
  });

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <p className="text-sm text-emerald-300">Spielleiter-Dashboard</p>
          <h1 className="text-4xl font-bold">Willkommen, {session.user.name}</h1>
        </div>
        <RoomCreator />
        <Card className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Spiele filtern</h2>
              <p className="text-sm text-slate-400">Filtere nach Status, Spiel-ID und Sortierung.</p>
            </div>
            <p className="text-sm text-slate-400">{sortedRooms.length} Spiele gefunden</p>
          </div>
          <form className="grid gap-3 md:grid-cols-[0.8fr_1.2fr_1fr_auto]" method="GET">
            <label className="space-y-2 text-sm">
              <span>Status</span>
              <Select name="status" defaultValue={status}>
                <option value="ALL">Alle</option>
                <option value="WAITING">Wartend</option>
                <option value="ACTIVE">Aktiv</option>
                <option value="COMPLETED">Abgeschlossen</option>
                <option value="EXPIRED">Abgelaufen</option>
              </Select>
            </label>
            <label className="space-y-2 text-sm">
              <span>Spiel-ID suchen</span>
              <Input name="query" defaultValue={query} placeholder="z. B. 12345678" />
            </label>
            <label className="space-y-2 text-sm">
              <span>Sortieren nach</span>
              <Select name="sort" defaultValue={sort}>
                <option value="created-desc">Neueste zuerst</option>
                <option value="updated-desc">Zuletzt aktiv</option>
                <option value="expires-asc">Läuft bald ab</option>
                <option value="participants-desc">Meiste Spieler</option>
              </Select>
            </label>
            <button className="rounded-2xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300" type="submit">
              Anwenden
            </button>
          </form>
        </Card>
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sortedRooms.map((room) => {
            const completedCount = room.participants.filter((participant) => participant.status === 'COMPLETED').length;
            return (
              <Card key={room.id} className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold">{room.joinId}</h2>
                  <span className="text-sm text-slate-400">{room.status}</span>
                </div>
                <p className="text-sm text-slate-300">{formatLanguage(room.language)} · {room.participants.length} Spieler</p>
                <p className="text-xs text-slate-400">Läuft ab: {room.expiresAt.toLocaleString('de-DE')}</p>
                <p className="text-xs text-slate-400">Zuletzt aktualisiert: {room.updatedAt.toLocaleString('de-DE')}</p>
                <p className="text-xs text-emerald-300">Abgeschlossen: {completedCount}/{room.participants.length}</p>
                <Link href={`/room/${room.joinId}/teacher`} className="text-sm text-emerald-300 underline">Zur Lobby</Link>
              </Card>
            );
          })}
          {sortedRooms.length === 0 ? (
            <Card className="md:col-span-2 xl:col-span-3">
              <p className="text-sm text-slate-300">Keine Spiele passend zu den aktuellen Filtern gefunden.</p>
            </Card>
          ) : null}
        </section>
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Gespeicherte iPad-Spiele</h2>
            <p className="text-sm text-slate-400">Letzte {gameSessions.length} Sitzungen</p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="min-w-full divide-y divide-white/10 text-sm">
              <thead className="bg-white/5 text-left text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Modus</th>
                  <th className="px-4 py-3 font-medium">Spieler</th>
                  <th className="px-4 py-3 font-medium">Positionen</th>
                  <th className="px-4 py-3 font-medium">Zeit</th>
                  <th className="px-4 py-3 font-medium">Export</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-slate-950/40">
                {gameSessions.map((gs) => {
                  const lines = gs.players.reduce((sum, p) => sum + p.cartLines.length, 0);
                  return (
                    <tr key={gs.id}>
                      <td className="px-4 py-3 font-mono text-xs text-white">{gs.id}</td>
                      <td className="px-4 py-3 text-slate-300">{gs.mode}</td>
                      <td className="px-4 py-3 text-slate-300">{gs.players.length}</td>
                      <td className="px-4 py-3 text-slate-300">{lines}</td>
                      <td className="px-4 py-3 text-slate-300">{gs.createdAt.toLocaleString('de-DE')}</td>
                      <td className="px-4 py-3 space-x-3">
                        <a className="text-emerald-300 underline" href={`/api/game/sessions/${gs.id}/export`}>CSV</a>
                        <a className="text-sky-300 underline" href={`/api/game/sessions/${gs.id}/report`} target="_blank" rel="noreferrer">PDF/Print</a>
                      </td>
                    </tr>
                  );
                })}
                {gameSessions.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Noch keine gespeicherten Spiele.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </main>
  );
}
