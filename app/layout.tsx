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
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Guard against browser extension injection bugs (e.g. Brave iOS WalletTabHelper)
                  window.addEventListener('error', function(e) {
                    if (e && e.message && (
                      e.message.indexOf('ethereum') !== -1 ||
                      e.message.indexOf('selectedAddress') !== -1
                    )) {
                      e.preventDefault();
                      e.stopPropagation();
                      return true;
                    }
                  }, true);

                  // Safe stub so attempts like 'window.ethereum.selectedAddress = undefined' do not throw TypeError
                  if (typeof window !== 'undefined' && typeof window.ethereum === 'undefined') {
                    var _eth = {};
                    Object.defineProperty(window, 'ethereum', {
                      get: function() { return _eth; },
                      set: function(val) { _eth = val; },
                      configurable: true,
                      enumerable: false
                    });
                  }
                } catch (_) {}
              })();
            `,
          }}
        />
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
