import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'QuickNote - Clean & Modern Note Taking',
  description: 'A lightweight, responsive, and user-friendly note-taking single page web application.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
