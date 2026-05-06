import Link from 'next/link';
import { Card } from '@/src/components/ui';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <Card className="max-w-md space-y-4 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">LinguaClass</p>
        <h1 className="text-3xl font-bold">Spielleiter-Funktionen pausiert</h1>
        <p className="text-slate-300">
          Login und Registrierung sind vorübergehend ausgeblendet. Der Fokus liegt aktuell auf dem Spiel und seinen Dateninhalten.
        </p>
        <Link className="inline-flex rounded-2xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950" href="/game">
          Spiel starten
        </Link>
      </Card>
    </main>
  );
}
