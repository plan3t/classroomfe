import Link from 'next/link';
import { AuthForm } from '@/src/components/auth-form';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="space-y-4">
        <AuthForm mode="login" />
        <p className="text-center text-sm text-slate-400">Noch kein Konto? <Link className="text-emerald-300" href="/register">Registrieren</Link></p>
      </div>
    </main>
  );
}
