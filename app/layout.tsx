import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import { ConditionalLayout } from '@/components/layout/conditional-layout';
import { WebVitalsReporter } from '@/components/web-vitals';

export const metadata: Metadata = {
  title: 'TEA Techniques - Responsible AI Design & Development',
  description:
    'Explore techniques for evidencing claims about responsible AI design, development, and deployment. Comprehensive catalog of techniques for explainability, fairness, privacy, reliability, safety, security, and transparency.',
  keywords: [
    'AI',
    'responsible AI',
    'explainability',
    'fairness',
    'privacy',
    'machine learning',
    'AI ethics',
  ],
  authors: [{ name: 'TEA Platform' }],
  creator: 'TEA Platform',
  publisher: 'TEA Platform',
  robots: 'index, follow',
  openGraph: {
    title: 'TEA Techniques - Responsible AI Design & Development',
    description:
      'Explore techniques for evidencing claims about responsible AI design, development, and deployment.',
    type: 'website',
    locale: 'en_US',
    siteName: 'TEA Techniques',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TEA Techniques - Responsible AI Design & Development',
    description:
      'Explore techniques for evidencing claims about responsible AI design, development, and deployment.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
        >
          <WebVitalsReporter />
          <ConditionalLayout>{children}</ConditionalLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
