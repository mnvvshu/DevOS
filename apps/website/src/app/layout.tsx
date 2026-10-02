import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import LenisProvider from '@/lib/animation/lenis-provider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DevOS — Local-First AI Developer OS',
  description: 'Experience the future of local-first AI development with DevOS. Built for speed, privacy, and productivity.',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased font-sans min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <LenisProvider>
          {children}
        </LenisProvider>
      </body>
    </html>
  );
}
