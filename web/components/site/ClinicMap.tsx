'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MAP, NEIGHBOURS, project, TURKEY } from '@/components/site/turkey-map';
import { copy, type Locale } from '@/content/site';

const STEP_MS = 3600;

export type MapClinic = {
  slug: string;
  href: string;
  name: string;
  district: string;
  city: string;
  lat: number;
  lon: number;
  cover: string;
  alt: string;
  from: string;
  rates: string;
};

/**
 * Hero haritası: demo klinikleri Türkiye haritasında gösterir, kartı sırayla döndürür.
 * İstanbul'daki klinikler bu ölçekte üst üste düştüğü için şehir başına tek pin var;
 * kart o şehirdeki klinikleri sırayla gösterir. "Hareketi azalt" açıksa döngü ve nabız yok.
 */
export function ClinicMap({ locale, clinics }: { locale: Locale; clinics: MapClinic[] }) {
  const t = copy[locale].map;
  const l = copy[locale].living;
  const [index, setIndex] = useState(0);
  const [moving, setMoving] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [stopped, setStopped] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    setMoving(!reduce.matches);
    const onChange = () => setMoving(!reduce.matches);
    reduce.addEventListener('change', onChange);
    return () => reduce.removeEventListener('change', onChange);
  }, []);

  const paused = !moving || hovered || stopped;
  useEffect(() => {
    if (paused) return;
    const id = window.setTimeout(() => setIndex((i) => (i + 1) % clinics.length), STEP_MS);
    return () => window.clearTimeout(id);
  }, [paused, index, clinics.length]);

  // Şehir başına bir pin: o şehirdeki kliniklerin ortalama konumu.
  const cities = [...new Set(clinics.map((c) => c.city))].map((city) => {
    const members = clinics.filter((c) => c.city === city);
    const lat = members.reduce((s, c) => s + c.lat, 0) / members.length;
    const lon = members.reduce((s, c) => s + c.lon, 0) / members.length;
    const [x, y] = project(lat, lon);
    return { city, x, y, count: members.length, first: clinics.indexOf(members[0]!) };
  });

  const active = clinics[index]!;
  // Uçuş çizgileri batıdan, Avrupa yönünden gelir.
  const flights = cities.map((c, i) => {
    const sx = -40;
    const sy = 40 + i * 120;
    return `M${sx} ${sy}Q${(sx + c.x) / 2} ${Math.min(sy, c.y) - 70} ${c.x} ${c.y}`;
  });

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={() => setHovered(false)}
      className="relative"
    >
      <div className="relative overflow-hidden rounded-[32px] bg-linear-to-br from-sky/70 via-mist to-paper px-3 pt-3 pb-7 shadow-[0_30px_80px_-30px_rgb(0_69_91_/_0.35)] ring-1 ring-deep/5 sm:px-5 sm:pt-5 sm:pb-14">
        <svg viewBox={`0 0 ${MAP.width} ${MAP.height}`} role="img" aria-label={t.label} className="block w-full">
          <path d={NEIGHBOURS} fill="#ffffff" fillOpacity="0.35" stroke="#b9dde4" strokeWidth="1" strokeLinejoin="round" />
          <path d={TURKEY} fill="#ffffff" stroke="#038c9c" strokeOpacity="0.45" strokeWidth="1.6" strokeLinejoin="round" />
          {flights.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke="#038c9c"
              strokeOpacity="0.6"
              strokeWidth="3.5"
              strokeLinecap="round"
              className={moving ? 'map-flight' : undefined}
              strokeDasharray={moving ? undefined : '2 10'}
            />
          ))}
          {cities.map((c) => {
            const on = c.city === active.city;
            const choose = () => setIndex(c.first);
            return (
              <g
                key={c.city}
                role="button"
                tabIndex={0}
                aria-label={`${c.city} · ${t.count(c.count)}`}
                aria-pressed={on}
                onClick={choose}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), choose())}
                className="cursor-pointer outline-none [&:focus-visible>circle:last-of-type]:stroke-teal"
              >
                {on && moving && <circle cx={c.x} cy={c.y} r="14" fill="#21bfca" className="map-ping" />}
                <circle cx={c.x} cy={c.y} r={on ? 15 : 11} fill={on ? '#00455b' : '#038c9c'} stroke="#ffffff" strokeWidth="4" />
                <text
                  x={c.x + 24}
                  y={c.y + 10}
                  className="fill-ink font-sans"
                  fontSize="32"
                  fontWeight={on ? 600 : 500}
                  paintOrder="stroke"
                  stroke="#ffffff"
                  strokeWidth="9"
                  strokeLinejoin="round"
                >
                  {c.city}
                  {c.count > 1 && <tspan className="fill-muted" fontWeight="400">{` · ${c.count}`}</tspan>}
                </text>
              </g>
            );
          })}
        </svg>

      </div>

      <Link
        key={active.slug}
        href={active.href}
        className="fade-in group relative z-10 mx-3 -mt-5 flex sm:-mt-12 items-center gap-4 rounded-3xl bg-paper p-3 pr-5 shadow-[0_24px_60px_-24px_rgb(0_69_91_/_0.45)] ring-1 ring-deep/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal sm:mx-6"
      >
        <span className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-mist">
          <Image src={active.cover} alt={active.alt} fill sizes="80px" className="object-cover" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-serif text-[1.15rem] leading-tight">{active.name}</span>
          <span className="mt-0.5 block truncate text-[13px] text-muted">
            {active.district}, {active.city}
          </span>
          <span className="mt-1.5 block text-[13px]">
            <span className="text-muted">{t.from}</span> <span className="font-medium">{active.from}</span>
            <span className="text-muted"> · {t.deposit} {active.rates}</span>
          </span>
        </span>
        <span aria-hidden className="text-held transition-transform duration-200 group-hover:translate-x-0.5">
          →
        </span>
      </Link>

      <div className="mx-3 mt-4 flex items-center gap-3 sm:mx-6">
        <div className="flex flex-1 gap-1.5" role="group" aria-label={t.label}>
          {clinics.map((c, i) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={c.name}
              aria-current={i === index ? 'true' : undefined}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal ${
                i === index ? 'bg-teal' : 'bg-sky/70 hover:bg-aqua/60'
              }`}
            />
          ))}
        </div>
        {moving && (
          <button
            type="button"
            onClick={() => setStopped((v) => !v)}
            aria-label={stopped ? l.play : l.pause}
            className="grid size-8 shrink-0 place-items-center rounded-full bg-paper/80 text-deep ring-1 ring-rule focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
          >
            <svg viewBox="0 0 16 16" aria-hidden className="size-3.5">
              {stopped ? (
                <path d="M5 3.5v9l7-4.5-7-4.5Z" className="fill-current" />
              ) : (
                <path d="M5 3.5v9M11 3.5v9" className="stroke-current" strokeWidth="2" strokeLinecap="round" />
              )}
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
