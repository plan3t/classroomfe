import Link from 'next/link';
import { Card } from '@/src/components/ui';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.25),_transparent_35%),linear-gradient(180deg,#020617,#0f172a)] px-6 py-12">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6 py-10">
          <p className="text-sm uppercase tracking-[0.4em] text-emerald-300">LinguaClass</p>
          <h1 className="max-w-3xl text-5xl font-black leading-tight">Responsive Sprachlernplattform für Lehrer und Schüler.</h1>
          <p className="max-w-2xl text-lg text-slate-300">Lehrer erstellen Live-Räume für das Thema Supermarkt, Schüler treten per Join-ID oder QR-Code bei und beantworten Bilderrätsel in Deutsch, Englisch, Französisch oder Spanisch.</p>
          <div className="flex flex-wrap gap-3">
            <Link className="rounded-2xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950" href="/register">Lehrer registrieren</Link>
            <Link className="rounded-2xl border border-white/15 px-5 py-3 font-semibold" href="/join">Als Schüler beitreten</Link>
          </div>
        </section>
        <Card className="space-y-4 self-start">
          <h2 className="text-2xl font-bold">Features</h2>
          <ul className="space-y-3 text-sm text-slate-300">
            <li>Live-Warteraum und Sessionstart in Echtzeit</li>
            <li>Automatisch generierte Join-ID und QR-Code</li>
            <li>Antwortprüfung mit Normalisierung und Alternativen</li>
            <li>Browser-Text-to-Speech bei aktivierter Sprachhilfe</li>
            <li>NFC optional per Feature-Flag und Capability-Check</li>
          </ul>
        </Card>
      </div>
    </main>
  );
}
