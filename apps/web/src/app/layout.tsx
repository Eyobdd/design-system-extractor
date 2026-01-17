import type { Metadata } from 'next';
import './globals.css';
import { WizardProvider } from '@/contexts/wizard-context';

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
        <WizardProvider>{children}</WizardProvider>
      </body>
    </html>
  );
}
