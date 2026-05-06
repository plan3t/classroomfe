import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'LinguaClass',
  description: 'Begleitapp für Brettspiele mit Spielmodus, Lebensmitteln und Einkaufsdaten',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
