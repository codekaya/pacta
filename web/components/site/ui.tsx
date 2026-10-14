import { Em } from '@/components/site/Em';

export const wrap = 'mx-auto max-w-6xl px-6 md:px-8';
export const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal';
export const primary = `inline-flex h-12 items-center justify-center gap-2 rounded-full bg-deep px-6 text-[15px] font-medium text-paper shadow-[0_12px_30px_-12px_rgb(0_69_91_/_0.7)] transition-colors duration-150 hover:bg-ink ${focus}`;
export const secondary = `inline-flex h-12 items-center justify-center gap-2 rounded-full bg-paper px-6 text-[15px] font-medium text-ink ring-1 ring-rule transition-shadow duration-150 hover:ring-teal/50 ${focus}`;

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-[12px] tracking-[0.2em] text-held uppercase">{children}</p>;
}

export function Title({ text, as: Tag = 'h2', className = '' }: { text: string; as?: 'h1' | 'h2'; className?: string }) {
  return (
    <Tag className={`mt-4 font-serif text-[2.25rem] leading-[1.08] tracking-[-0.02em] text-balance sm:text-[2.75rem] ${className}`}>
      <Em text={text} />
    </Tag>
  );
}

export function Check({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className={className}>
      <circle cx="10" cy="10" r="10" className="fill-current opacity-15" />
      <path d="M6 10.4 8.6 13 14 7.5" fill="none" className="stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Cross({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className={className}>
      <circle cx="10" cy="10" r="10" className="fill-current opacity-15" />
      <path d="m7 7 6 6m0-6-6 6" className="stroke-current" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Arrow({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={className}>
      <path d="M3 8h10m-4-4 4 4-4 4" fill="none" className="stroke-current" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** The logo's background: two soft, wide arcs of light. */
export function Sweep() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
    >
      <circle cx="1500" cy="-180" r="760" fill="#ffffff" fillOpacity="0.45" />
      <circle cx="-160" cy="1180" r="720" fill="#ffffff" fillOpacity="0.5" />
      <path d="M-40 640C300 520 720 560 1080 940" fill="none" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="1.5" />
    </svg>
  );
}
