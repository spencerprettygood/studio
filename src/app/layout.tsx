
import type { Metadata } from 'next';
import { Raleway, Arimo } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

// Typography: Raleway for headings (ultra-thin), Arimo for body
const raleway = Raleway({
  subsets: ['latin'],
  variable: '--font-raleway',
  weight: '200', // Ultra-thin
});

const arimo = Arimo({
  subsets: ['latin'],
  variable: '--font-arimo',
  weight: ['400', '700'], // Regular and Bold if needed
});

export const metadata: Metadata = {
  title: 'PromptFlow',
  description: 'Organize and optimize your AI LLM prompts with an intuitive chat interface.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning> {/* Force dark theme as per spec */}
      <body className={`${raleway.variable} ${arimo.variable} antialiased bg-background text-foreground`}>
        <main className="min-h-screen flex flex-col">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
