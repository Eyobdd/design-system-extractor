import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Design System Extractor',
  description: 'Extract design systems from any website using AI',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <main className="flex min-h-screen flex-col">{children}</main>
      </body>
    </html>
  );
}
