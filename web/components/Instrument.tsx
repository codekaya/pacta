import Link from 'next/link';

/**
 * Belgenin parçaları.
 *
 * Yön: bu bir web sayfası değil, bir teminat belgesi. Bunun pratik karşılığı üç
 * kural — etiketler sabit bir sütunda durur (havada değil), rakamlar tabular
 * mono'dur (serif değil), ve çizgi iki anlam taşır: çift çizgi bölüm sınırı,
 * tek çizgi satır ayracı. Serif tek bir yerde görünür: kurumun adı.
 */

// ---------------------------------------------------------------- kabuk

type SheetProps = {
  /** Üst bantta sağda duran belge referansı. */
  reference?: string;
  /** Bandın solundaki belge türü — "DEPOSIT UNDERTAKING" gibi. */
  kind: string;
  children: React.ReactNode;
};

export function Sheet({ reference, kind, children }: SheetProps) {
  return (
    <div className="min-h-dvh">
      <Band kind={kind} reference={reference} />
      {children}
    </div>
  );
}

/**
 * Üst bant. Eski tasarımdaki 8 piksellik siyah şerit dekordu; bu onun yerine
 * belgenin künyesini taşıyor — ne olduğu, hangi referansla, hangi ağda.
 */
function Band({ kind, reference }: { kind: string; reference?: string }) {
  return (
    <div className="bg-ink text-paper">
      <div className="mx-auto flex max-w-5xl flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-6 py-2 md:px-10">
        <p className="font-mono text-[11px] tracking-[0.04em] uppercase">
          <Link
            href="/"
            className="text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
          >
            Pacta
          </Link>
          <span className="text-paper/40"> / </span>
          {kind}
        </p>
        {reference && (
          <p className="font-mono text-[11px] tracking-[0.04em] text-paper/70 uppercase">{reference}</p>
        )}
      </div>
    </div>
  );
}

/** Belgenin gövdesi. Eski sayfalardan daha dar ve daha sıkı. */
export function Body({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`mx-auto px-6 md:px-10 ${wide ? 'max-w-6xl' : 'max-w-5xl'}`}>{children}</div>
  );
}

// ---------------------------------------------------------------- bölümler

/** Bölüm sınırı. Çift çizgi + mono başlık; belgede bir madde başlıyor demek. */
export function Section({
  title,
  aside,
  children,
}: {
  title?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rule-major pt-4 pb-8">
      {title && (
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h2 className="font-mono text-[11px] tracking-[0.04em] text-muted uppercase">{title}</h2>
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

// ---------------------------------------------------------------- satırlar

/**
 * Etiket / değer satırı. Etiket sabit sütunda, değer onun yanında — aralarında
 * boşluk esnemez. Bir formun doldurulmuş hâli böyle görünür.
 */
export function Entry({
  label,
  children,
  strong = false,
}: {
  label: string;
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="entry border-b border-rule py-2">
      <dt className="font-mono text-[11px] tracking-[0.04em] text-muted uppercase">{label}</dt>
      <dd className={`min-w-0 break-words ${strong ? 'text-ink' : 'text-ink'} text-[15px]`}>{children}</dd>
    </div>
  );
}

/**
 * Belgenin ana rakamı. Serif değil tabular mono: bir tutar, bir başlık değil.
 * Altındaki satır aynı tutarın zincirdeki karşılığı.
 */
export function Principal({
  label,
  amount,
  under,
}: {
  label: string;
  amount: string;
  under?: React.ReactNode;
}) {
  return (
    <div className="border-b border-rule py-3">
      <div className="flex items-baseline justify-between gap-6">
        <p className="font-mono text-[11px] tracking-[0.04em] text-muted uppercase">{label}</p>
        <p className="font-mono text-[2rem] leading-none tabular-nums">{amount}</p>
      </div>
      {under && <p className="mt-1.5 text-right font-mono text-[12px] text-muted tabular-nums">{under}</p>}
    </div>
  );
}

// ---------------------------------------------------------------- mühür

/**
 * Mühür. Bir belgenin "bu iş oldu" dediği yer; burada karşılığı escrow'un
 * zincirde durması. Kare, çünkü belgede yuvarlak hiçbir şey yok.
 */
export function Seal({
  state,
  caption,
  href,
}: {
  state: 'held' | 'released' | 'refunded';
  caption: string;
  href?: string;
}) {
  const tone =
    state === 'refunded' ? 'border-oxblood text-oxblood' : 'border-forest text-forest';
  const mark = state === 'refunded' ? '▧' : '■';

  return (
    <div className="flex items-center gap-4 py-1">
      <div
        aria-hidden
        className={`flex size-12 shrink-0 items-center justify-center border-2 ${tone} text-lg`}
      >
        {mark}
      </div>
      <div className="min-w-0">
        <p className={`font-mono text-[11px] tracking-[0.04em] uppercase ${tone.split(' ')[1]}`}>
          {caption}
        </p>
        {href && (
          <a
            className="mt-0.5 block truncate font-mono text-[12px] text-muted underline decoration-rule underline-offset-2 hover:text-ink hover:decoration-ink"
            href={href}
            target="_blank"
            rel="noreferrer"
          >
            on chain
          </a>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- ince yazı

/**
 * Gerçekten ince yazı. Bir belgede bu kısım küçüktür, sıkışıktır ve akar —
 * dostane bir paragrafa dönüştürmek onu ince yazı olmaktan çıkarır.
 */
export function FinePrint({ children }: { children: React.ReactNode }) {
  return <p className="max-w-[72ch] text-[11px] leading-[1.5] text-faint">{children}</p>;
}

/** Prose: belgedeki az sayıdaki düz cümle. */
export function Note({ children }: { children: React.ReactNode }) {
  return <p className="max-w-[64ch] text-sm leading-relaxed text-muted">{children}</p>;
}

/** Kurumun adı — serifin sayfadaki tek görünümü. */
export function Beneficiary({ name, city }: { name: string; city?: string }) {
  return (
    <p className="font-serif text-[1.75rem] leading-tight tracking-[-0.02em] text-ink">
      {name}
      {city && <span className="ml-3 font-sans text-sm tracking-normal text-muted">{city}</span>}
    </p>
  );
}

/**
 * Künye. Belgeyi kapatan satır — kimin düzenlediği, hangi kontratın taahhüt
 * ettiği, hangi ağda. Sayfanın boşlukta kesilmesini de engelliyor: bir belge
 * biter, durmaz.
 */
export function Colophon({ contractId }: { contractId?: string }) {
  return (
    <footer className="rule-major mt-2 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1 py-4 font-mono text-[11px] text-faint">
      <p>
        Issued by Pacta · custody by Trustless Work · Stellar testnet
      </p>
      {contractId && (
        <a
          className="underline decoration-rule underline-offset-2 hover:text-muted"
          href={`https://stellar.expert/explorer/testnet/contract/${contractId}`}
          target="_blank"
          rel="noreferrer"
        >
          Policy contract {contractId.slice(0, 4)}…{contractId.slice(-4)}
        </a>
      )}
    </footer>
  );
}
