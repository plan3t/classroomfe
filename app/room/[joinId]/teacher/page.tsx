import { notFound, redirect } from 'next/navigation';
import { TeacherRoom } from '@/src/components/teacher-room';
import { auth } from '@/src/lib/auth';
import { getRoomDetailForTeacher } from '@/src/lib/room-service';

export default async function TeacherRoomPage({ params }: { params: Promise<{ joinId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const { joinId } = await params;
  const room = await getRoomDetailForTeacher(session.user.id, joinId);
  if (!room) notFound();

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <TeacherRoom room={room} />
      </div>
    </main>
  );
}
