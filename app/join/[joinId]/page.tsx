import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { StudentRoom } from '@/src/components/student-room';
import { getLearningItems, getStudentRoom } from '@/src/lib/room-service';

export default async function StudentRoomPage({ params, searchParams }: { params: Promise<{ joinId: string }>; searchParams: Promise<{ participantId?: string }> }) {
  const { joinId } = await params;
  const { participantId } = await searchParams;
  if (!participantId) notFound();

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(`student-access-${participantId}`)?.value;
  if (!accessToken) notFound();

  const room = await getStudentRoom(joinId, participantId, accessToken).catch(() => null);
  if (!room) notFound();

  const items = await getLearningItems(room.language, room.languageHelp);
  return (
    <main className="min-h-screen px-6 py-12">
      <StudentRoom room={room} items={items} participantId={participantId} />
    </main>
  );
}
