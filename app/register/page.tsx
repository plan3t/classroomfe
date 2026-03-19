import Link from 'next/link';
import { AuthForm } from '@/src/components/auth-form';

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="space-y-4">
        <AuthForm mode="register" />
        <p className="text-center text-sm text-slate-400">Schon registriert? <Link className="text-emerald-300" href="/login">Zum Login</Link></p>
      </div>
    </main>
  );
}
