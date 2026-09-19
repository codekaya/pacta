'use client';

import { useState } from 'react';

/**
 * Bildirim linki kliniğin elindeki tek dağıtım aracı — WhatsApp'a yapıştırılıyor.
 * Yani kopyalama, sayfadaki en çok kullanılacak düğme.
 */
export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <code className="min-w-0 truncate border border-rule bg-ink/[0.03] px-3 py-2 font-mono text-[12px] text-muted">
        {url}
      </code>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            // Pano izni yoksa link zaten ekranda ve seçilebilir.
            setCopied(false);
          }
        }}
        className="min-h-10 border border-ink/25 px-4 text-sm text-ink transition-colors duration-150 hover:border-ink hover:bg-ink/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        {copied ? 'Copied' : 'Copy link'}
      </button>
      <span aria-live="polite" className="sr-only">
        {copied ? 'Link copied to the clipboard' : ''}
      </span>
    </div>
  );
}
