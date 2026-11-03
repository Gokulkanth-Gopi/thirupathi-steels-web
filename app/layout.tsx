import type { Metadata } from 'next';
import './globals.css';
import { LayoutChrome } from '@/components/layout/LayoutChrome';
import { constructMetadata, getLocalBusinessJsonLd } from '@/lib/seo';

export const metadata: Metadata = constructMetadata();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = getLocalBusinessJsonLd();

  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-slate-950 text-slate-100 flex flex-col min-h-screen">
        <LayoutChrome>{children}</LayoutChrome>
      </body>
    </html>
  );
}
