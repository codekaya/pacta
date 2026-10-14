/**
 * Pacta işareti — images/pacta-logo-teal.jpg'deki logonun vektör kopyası.
 * Koordinatlar 1254 px'lik orijinalden ölçüldü: çember (697, 540) r183,
 * gövde x=426, üst köşe r90, alt köşe r181; üst ucu (510, 541) merkezli r187 yayla çembere kıvrılır.
 * Gradyan kimlikleri sabit: aynı sayfada birden çok işaret aynı tanımları paylaşır.
 */
export function PactaMark({ className = '', title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="420 350 466 598"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <defs>
        <linearGradient id="pacta-bowl" gradientUnits="userSpaceOnUse" x1="640" y1="357" x2="770" y2="723">
          <stop offset="0" stopColor="#7adfe5" />
          <stop offset="0.3" stopColor="#22c0cb" />
          <stop offset="0.62" stopColor="#048c9b" />
          <stop offset="1" stopColor="#00455b" />
        </linearGradient>
        <radialGradient id="pacta-shade" gradientUnits="userSpaceOnUse" cx="615" cy="700" r="150">
          <stop offset="0" stopColor="#002a37" stopOpacity="0.7" />
          <stop offset="1" stopColor="#002a37" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="pacta-leaf" gradientUnits="userSpaceOnUse" x1="520" y1="541" x2="470" y2="860">
          <stop offset="0" stopColor="#b6fbec" />
          <stop offset="0.3" stopColor="#64ebda" />
          <stop offset="0.5" stopColor="#2fdccd" />
          <stop offset="1" stopColor="#0fd0c2" />
        </linearGradient>
        <linearGradient id="pacta-stem" gradientUnits="userSpaceOnUse" x1="600" y1="705" x2="440" y2="941">
          <stop offset="0" stopColor="#06aeaa" />
          <stop offset="0.55" stopColor="#049799" />
          <stop offset="1" stopColor="#03727b" />
        </linearGradient>
      </defs>
      <circle cx="697" cy="540" r="183" fill="url(#pacta-bowl)" />
      <circle cx="697" cy="540" r="183" fill="url(#pacta-shade)" />
      <path
        d="M426 631A90 90 0 0 1 516 541L697 541A187 187 0 0 1 607 701L607 760A181 181 0 0 1 426 941Z"
        fill="url(#pacta-leaf)"
      />
      <path d="M607 701L607 760A181 181 0 0 1 426 941L426 862C436 772 528 726 607 701Z" fill="url(#pacta-stem)" />
    </svg>
  );
}

/** Mark and name together, as in the header. */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <PactaMark className="h-8 w-auto" />
      <span className="font-serif text-[1.55rem] leading-none tracking-[-0.02em] text-ink">Pacta</span>
    </span>
  );
}
