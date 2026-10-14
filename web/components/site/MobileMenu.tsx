'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal';

/** Small-screen navigation. Closes on a link, Escape or a click outside. */
export function MobileMenu({ label, links }: { label: string; links: [string, string][] }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onClick = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  return (
    <div ref={root} className="relative lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        className={`grid size-10 place-items-center rounded-full bg-paper/70 text-ink ring-1 ring-rule backdrop-blur ${focus}`}
      >
        <svg viewBox="0 0 20 20" aria-hidden className="size-5">
          <path
            d={open ? 'm5 5 10 10M15 5 5 15' : 'M3.5 6h13M3.5 10h13M3.5 14h13'}
            className="stroke-current"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {open && (
        <nav
          aria-label={label}
          className="absolute top-12 right-0 w-60 rounded-2xl bg-paper p-2 shadow-[0_24px_60px_-20px_rgb(0_69_91_/_0.45)] ring-1 ring-deep/5"
        >
          {links.map(([to, text]) => (
            <Link
              key={to}
              href={to}
              onClick={() => setOpen(false)}
              className={`block rounded-xl px-4 py-3 text-[15px] text-ink hover:bg-mist ${focus}`}
            >
              {text}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
