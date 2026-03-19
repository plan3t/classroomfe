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

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <p className="text-sm text-emerald-300">Dashboard</p>
          <h1 className="text-4xl font-bold">Willkommen, {session.user.name}</h1>
        </div>
        <RoomCreator />
        <Card className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Räume filtern</h2>
              <p className="text-sm text-slate-400">Filtere nach Status, Join-ID und Sortierung.</p>
            </div>
            <p className="text-sm text-slate-400">{sortedRooms.length} Räume gefunden</p>
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
              <span>Join-ID suchen</span>
              <Input name="query" defaultValue={query} placeholder="z. B. 12345678" />
            </label>
            <label className="space-y-2 text-sm">
              <span>Sortieren nach</span>
              <Select name="sort" defaultValue={sort}>
                <option value="created-desc">Neueste zuerst</option>
                <option value="updated-desc">Zuletzt aktiv</option>
                <option value="expires-asc">Läuft bald ab</option>
                <option value="participants-desc">Meiste Teilnehmer</option>
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
                <p className="text-sm text-slate-300">{formatLanguage(room.language)} · {room.participants.length} Schüler</p>
                <p className="text-xs text-slate-400">Läuft ab: {room.expiresAt.toLocaleString('de-DE')}</p>
                <p className="text-xs text-slate-400">Zuletzt aktualisiert: {room.updatedAt.toLocaleString('de-DE')}</p>
                <p className="text-xs text-emerald-300">Abgeschlossen: {completedCount}/{room.participants.length}</p>
                <Link href={`/room/${room.joinId}/teacher`} className="text-sm text-emerald-300 underline">Zum Raum</Link>
              </Card>
            );
          })}
          {sortedRooms.length === 0 ? (
            <Card className="md:col-span-2 xl:col-span-3">
              <p className="text-sm text-slate-300">Keine Räume passend zu den aktuellen Filtern gefunden.</p>
            </Card>
          ) : null}
        </section>
      </div>
    </main>
  );
}
