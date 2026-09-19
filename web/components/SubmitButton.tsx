'use client';

import { useFormStatus } from 'react-dom';

type Variant = 'primary' | 'ghost';

type Props = {
  children: React.ReactNode;
  pendingLabel: string;
  variant?: Variant;
};

export function SubmitButton({ children, pendingLabel, variant = 'primary' }: Props) {
  const { pending } = useFormStatus();
  const base =
    'inline-flex min-h-11 w-full items-center justify-center px-5 font-mono text-[12px] tracking-[0.04em] uppercase transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-55';
  const skin =
    variant === 'primary'
      ? 'bg-ink text-paper hover:bg-oxblood'
      : 'border border-ink/25 bg-transparent text-muted hover:border-ink hover:text-ink';

  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={`${base} ${skin}`}>
      {pending ? pendingLabel : children}
    </button>
  );
}
