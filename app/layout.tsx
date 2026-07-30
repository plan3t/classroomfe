import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { ThemeSwitch } from '@/src/components/theme-switch';

export const metadata: Metadata = {
  title: 'Smart Eat',
  description: 'Smart Eat ist die Brettspiel-Begleitapp für Spielmodus, Lebensmittel und Einkaufsdaten.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('smart-eat-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){document.documentElement.dataset.theme='dark'}})();`,
          }}
        />
      </head>
      <body>
        <ThemeSwitch />
        {children}
      </body>
    </html>
  );
}
