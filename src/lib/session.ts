import { auth } from '@/src/lib/auth';

export async function requireTeacherSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Nicht autorisiert');
  }
  return session;
}
