'use client';

import { useEffect, useState } from 'react';
import { PactaMark } from '@/components/Logo';
import { copy, type Locale } from '@/content/site';

const STEP_MS = 3200;

export type NoticeRow = { label: string; amount: string; now: boolean };

type Props = {
  locale: Locale;
  clinic: string;
  procedure: string;
  deposit: string;
  rows: NoticeRow[];
  licence: string;
};

const PILL = [
  'bg-mist text-muted',
  'bg-foam/60 text-held',
  'bg-deep text-paper',
  'bg-linear-to-r from-teal to-deep text-paper',
];

/**
 * Hero kartı: bir kaporanın dört durumu, kendiliğinden döner.
 * İlerleme çubuğundaki CSS animasyonu bittiğinde bir sonraki duruma geçilir;
 * duraklatmak animasyonu durdurmak demek. "Hareketi azalt" açıksa kart
 * "escrow'da" durumunda sabit kalır.
 */
export function LivingNotice({ locale, clinic, procedure, deposit, rows, licence }: Props) {
  const t = copy[locale].living;
  const [index, setIndex] = useState(1);
  const [moving, setMoving] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [stopped, setStopped] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!reduce.matches) {
      setIndex(0);
      setMoving(true);
    }
    const onChange = () => {
      setMoving(!reduce.matches);
      if (reduce.matches) setIndex(1);
    };
    reduce.addEventListener('change', onChange);
    return () => reduce.removeEventListener('change', onChange);
  }, []);

  const paused = hovered || stopped;
  const state = t.states[index]!;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={() => setHovered(false)}
    >
      <div className="rounded-[28px] bg-paper p-7 shadow-[0_30px_80px_-30px_rgb(0_69_91_/_0.35)] ring-1 ring-deep/5 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] tracking-[0.2em] text-held uppercase">{t.notice}</p>
            <p className="mt-3 font-serif text-[1.75rem] leading-tight tracking-[-0.01em]">{clinic}</p>
            <p className="mt-1 text-[15px] text-muted">{procedure}</p>
          </div>
          <PactaMark className="h-9 w-auto shrink-0" />
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <p key={`amount-${index === 3}`} className="fade-in font-serif text-[3rem] leading-none tracking-[-0.02em] tabular-nums">
            {index === 3 ? t.paid : deposit}
          </p>
          <span key={`pill-${index}`} className={`fade-in inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium whitespace-nowrap ${PILL[index]}`}>
            {index === 1 && <Lock />}
            {state.pill}
          </span>
        </div>

        <p className="mt-7 text-[13px] text-muted">{t.ifCancel}</p>
        <ul className="mt-2 text-[15px]">
          {rows.map((row) => (
            <li
              key={row.label}
              className={`flex items-center justify-between gap-4 rounded-xl px-3 py-2.5 ${row.now ? 'bg-mist' : ''}`}
            >
              <span className={row.now ? 'text-ink' : 'text-muted'}>
                {row.label}
                {row.now && <span className="ml-2 text-[12px] font-medium text-held">{t.today}</span>}
              </span>
              <span className="tabular-nums">{row.amount}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 min-h-[5.75rem] border-t border-rule pt-4">
          <p key={`note-${index}`} className="fade-in flex items-center gap-2 text-[14px] text-ink">
            <Dot done={index > 0} />
            {state.note}
          </p>
          {index === 0 ? (
            <span key="pay" className="fade-in mt-3 flex h-11 items-center justify-center rounded-full bg-deep text-[15px] font-medium text-paper">
              {t.pay} {deposit}
            </span>
          ) : (
            <p key="licence" className="fade-in mt-3 text-[13px] text-muted">
              {t.licence} {licence}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <div role="group" aria-label={t.progress} className="grid flex-1 grid-cols-4 gap-2">
          {t.states.map((s, i) => (
            <button
              key={s.short}
              type="button"
              onClick={() => setIndex(i)}
              aria-current={i === index ? 'step' : undefined}
              className="group rounded-md text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
            >
              <span className="block h-1 overflow-hidden rounded-full bg-sky/60">
                {i < index || (i === index && !moving) ? (
                  <span className="block h-full w-full rounded-full bg-teal" />
                ) : i === index ? (
                  <span
                    key={index}
                    onAnimationEnd={() => setIndex((n) => (n + 1) % t.states.length)}
                    className="block h-full w-full origin-left rounded-full bg-teal"
                    style={{ animation: `fill ${STEP_MS}ms linear forwards`, animationPlayState: paused ? 'paused' : 'running' }}
                  />
                ) : null}
              </span>
              <span className={`mt-2 block truncate text-[12px] ${i === index ? 'font-medium text-ink' : 'text-muted group-hover:text-ink'}`}>
                {s.short}
              </span>
            </button>
          ))}
        </div>
        {moving && (
          <button
            type="button"
            onClick={() => setStopped((v) => !v)}
            aria-label={stopped ? t.play : t.pause}
            className="-mt-5 grid size-8 shrink-0 place-items-center rounded-full bg-paper/80 text-deep ring-1 ring-rule focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
          >
            <svg viewBox="0 0 16 16" aria-hidden className="size-3.5">
              {stopped ? <path d="M5 3.5v9l7-4.5-7-4.5Z" className="fill-current" /> : <path d="M5 3.5v9M11 3.5v9" className="stroke-current" strokeWidth="2" strokeLinecap="round" />}
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

function Lock() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className="size-3">
      <rect x="3" y="7" width="10" height="7" rx="1.5" className="fill-current" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" fill="none" className="stroke-current" strokeWidth="1.6" />
    </svg>
  );
}

function Dot({ done }: { done: boolean }) {
  return done ? (
    <svg viewBox="0 0 20 20" aria-hidden className="size-4 shrink-0 text-held">
      <circle cx="10" cy="10" r="10" className="fill-current opacity-15" />
      <path d="M6 10.4 8.6 13 14 7.5" fill="none" className="stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <span aria-hidden className="grid size-4 shrink-0 place-items-center">
      <span className="size-2 rounded-full bg-aqua" />
    </span>
  );
}
