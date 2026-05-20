import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Smart Eat',
  description: 'Smart Eat ist die Brettspiel-Begleitapp für Spielmodus, Lebensmittel und Einkaufsdaten.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
