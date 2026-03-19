import { notFound } from 'next/navigation';
import { StudentRoom } from '@/src/components/student-room';
import { getLearningItems } from '@/src/lib/room-service';
import { prisma } from '@/src/lib/prisma';

export default async function StudentRoomPage({ params, searchParams }: { params: Promise<{ joinId: string }>; searchParams: Promise<{ participantId?: string }> }) {
  const { joinId } = await params;
  const { participantId } = await searchParams;
  const room = await prisma.room.findUnique({ where: { joinId } });
  if (!room || !participantId) notFound();
  const items = await getLearningItems();
  return (
    <main className="min-h-screen px-6 py-12">
      <StudentRoom room={room} items={items} participantId={participantId} />
    </main>
  );
}
