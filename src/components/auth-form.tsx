'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input } from '@/src/components/ui';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
    };

    const endpoint = mode === 'register' ? '/api/register' : '/api/login';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ message: 'Fehler' }));
      setError(body.message ?? 'Unbekannter Fehler');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <Card className="mx-auto max-w-md space-y-5">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">LinguaClass</p>
        <h1 className="mt-2 text-3xl font-bold">{mode === 'register' ? 'Lehrer-Konto erstellen' : 'Lehrer-Login'}</h1>
      </div>
      <form action={handleSubmit} className="space-y-4">
        {mode === 'register' ? <Input name="name" placeholder="Name" required /> : null}
        <Input name="email" type="email" placeholder="E-Mail" required />
        <Input name="password" type="password" placeholder="Passwort" required minLength={8} />
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Bitte warten…' : mode === 'register' ? 'Registrieren' : 'Anmelden'}
        </Button>
      </form>
    </Card>
  );
}
