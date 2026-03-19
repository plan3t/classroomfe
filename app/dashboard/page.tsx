import { redirect } from 'next/navigation';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { expireRoomsForTeacher } from '@/src/lib/room-service';
import { RoomCreator } from '@/src/components/room-creator';
import { Card } from '@/src/components/ui';
import type { LanguageCode, RoomStatusCode } from '@/src/lib/contracts';

type DashboardRoom = {
  id: string;
  joinId: string;
  language: LanguageCode;
  status: RoomStatusCode;
  expiresAt: Date;
  participants: Array<{ id: string; status: 'WAITING' | 'ACTIVE' | 'COMPLETED' }>;
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  await expireRoomsForTeacher(session.user.id);

  const rooms = (await prisma.room.findMany({
    where: { teacherId: session.user.id },
    include: { participants: true },
    orderBy: { createdAt: 'desc' },
  })) as DashboardRoom[];

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <p className="text-sm text-emerald-300">Dashboard</p>
          <h1 className="text-4xl font-bold">Willkommen, {session.user.name}</h1>
        </div>
        <RoomCreator />
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rooms.map((room) => {
            const completedCount = room.participants.filter((participant) => participant.status === 'COMPLETED').length;
            return (
              <Card key={room.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">{room.joinId}</h2>
                  <span className="text-sm text-slate-400">{room.status}</span>
                </div>
                <p className="text-sm text-slate-300">{room.language} · {room.participants.length} Schüler</p>
                <p className="text-xs text-slate-400">Läuft ab: {room.expiresAt.toLocaleString('de-DE')}</p>
                <p className="text-xs text-emerald-300">Abgeschlossen: {completedCount}/{room.participants.length}</p>
                <a href={`/room/${room.joinId}/teacher`} className="text-sm text-emerald-300 underline">Zum Raum</a>
              </Card>
            );
          })}
        </section>
      </div>
    </main>
  );
}
