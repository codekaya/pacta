'use client';

import Link from 'next/link';
import { useActionState, useEffect, useRef, useState } from 'react';
import { Em } from '@/components/site/Em';
import { Arrow, Check, focus, primary, secondary } from '@/components/site/ui';
import { WhatsAppLink } from '@/components/site/WhatsApp';
import { copy, href, type Locale } from '@/content/site';
import { submitPilot, type PilotState } from '@/lib/pilot';

type ErrorKey = 'required' | 'chooseOne' | 'invalidPhone' | 'invalidEmail' | 'failed';
type Errors = Partial<Record<string, ErrorKey>>;

/** Hangi alan hangi adımda — sunucudan hata dönerse o adıma geri gidilir. */
const STEP_FIELDS: string[][] = [
  ['role', 'org', 'city', 'treatments', 'web', 'clinics'],
  ['method', 'share', 'volume', 'refund', 'chargeback', 'lost'],
  ['name', 'title', 'whatsapp', 'email', 'lang', 'consent'],
];

function validate(step: number, form: FormData): Errors {
  const errors: Errors = {};
  const filled = (key: string) => String(form.get(key) ?? '').trim().length > 0;
  if (step === 0) {
    if (!filled('role')) errors.role = 'required';
    if (!filled('org')) errors.org = 'required';
    if (!filled('city')) errors.city = 'required';
    if (form.getAll('treatments').length === 0) errors.treatments = 'chooseOne';
  }
  if (step === 1 && form.getAll('method').length === 0) errors.method = 'chooseOne';
  if (step === 2) {
    if (!filled('name')) errors.name = 'required';
    const phone = String(form.get('whatsapp') ?? '');
    if (phone.replace(/\D/g, '').length < 8) errors.whatsapp = 'invalidPhone';
    const email = String(form.get('email') ?? '').trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'invalidEmail';
    if (form.get('consent') !== 'yes') errors.consent = 'required';
  }
  return errors;
}

export function PilotForm({ locale }: { locale: Locale }) {
  const t = copy[locale].pilot;
  const f = t.fields;
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLParagraphElement>(null);
  const [state, action, pending] = useActionState<PilotState, FormData>(submitPilot, undefined);
  const [step, setStep] = useState(0);
  const [role, setRole] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [snapshot, setSnapshot] = useState<FormData | null>(null);

  // Sunucu bir alanı reddettiyse o alanın adımına dön.
  useEffect(() => {
    if (state && !state.ok) {
      setErrors(state.errors);
      const back = STEP_FIELDS.findIndex((fields) => fields.some((key) => key in state.errors));
      if (back >= 0) setStep(back);
    }
  }, [state]);

  // Adım değişince odağı adım başlığına taşı (ilk yüklemede değil — sayfa kaymasın).
  const shownStep = useRef(step);
  useEffect(() => {
    if (shownStep.current !== step) headingRef.current?.focus();
    shownStep.current = step;
  }, [step]);

  if (state?.ok) {
    return (
      <div className="rounded-[28px] bg-paper p-8 ring-1 ring-rule sm:p-10">
        <span className="grid size-12 place-items-center rounded-full bg-foam text-held">
          <Check className="size-7" />
        </span>
        <h2 className="mt-6 font-serif text-[2rem] leading-tight">
          <Em text={t.done.title(state.name)} />
        </h2>
        <p className="mt-8 text-[13px] font-medium text-muted">{t.done.next}</p>
        <ol className="mt-4 space-y-4">
          {t.done.steps.map((line, i) => (
            <li key={line} className="flex gap-4 text-[15px]">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-mist font-serif text-deep">{i + 1}</span>
              <span className="pt-0.5">{line}</span>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-wrap gap-3">
          <WhatsAppLink locale={locale} className={primary} />
          <Link href={href(locale)} className={secondary}>
            {t.done.home}
          </Link>
        </div>
      </div>
    );
  }

  const next = () => {
    const data = new FormData(formRef.current!);
    const found = validate(step, data);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    if (step === 2) setSnapshot(data);
    setStep((s) => s + 1);
  };

  const message = (key: string) => {
    const code = errors[key];
    return code ? t[code] : undefined;
  };

  return (
    <form ref={formRef} action={action} noValidate className="relative rounded-[28px] bg-paper p-6 ring-1 ring-rule sm:p-10">
      <input type="hidden" name="locale" value={locale} />
      <div aria-hidden className="absolute -left-[9999px]">
        <label>
          Company site
          <input type="text" name="company_site" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <ol className="grid grid-cols-4 gap-2">
        {t.stepNames.map((name, i) => (
          <li key={name} aria-current={i === step ? 'step' : undefined}>
            <span className={`block h-1 rounded-full ${i <= step ? 'bg-teal' : 'bg-mist'}`} />
            <span className={`mt-2 hidden text-[12px] sm:block ${i === step ? 'font-medium text-ink' : 'text-muted'}`}>{name}</span>
          </li>
        ))}
      </ol>
      <p ref={headingRef} tabIndex={-1} className="mt-6 text-[13px] text-muted outline-none">
        {t.stepOf(step + 1, t.stepNames.length)} · <span className="font-medium text-ink">{t.stepNames[step]}</span>
      </p>

      <div hidden={step !== 0} className="mt-6 space-y-7">
        <Choice name="role" label={f.role.label} options={f.role.options} error={message('role')} onChange={setRole} />
        <Text name="org" label={f.org.label} error={message('org')} autoComplete="organization" />
        <Text name="city" label={f.city.label} placeholder={f.city.placeholder} error={message('city')} autoComplete="address-level2" />
        <Choice name="treatments" label={f.treatments.label} options={f.treatments.options} multiple error={message('treatments')} />
        <Text name="web" label={f.web.label} placeholder={f.web.placeholder} optional={t.optional} />
        {role === 'agency' && <Choice name="clinics" label={f.clinics.label} options={f.clinics.options} />}
      </div>

      <div hidden={step !== 1} className="mt-6 space-y-7">
        <Choice name="method" label={f.method.label} options={f.method.options} multiple error={message('method')} />
        <Choice name="share" label={f.share.label} options={f.share.options} />
        <Choice name="volume" label={f.volume.label} options={f.volume.options} />
        <Choice name="refund" label={f.refund.label} options={f.refund.options} />
        <Choice name="chargeback" label={f.chargeback.label} options={f.chargeback.options} />
        <Choice name="lost" label={f.lost.label} options={f.lost.options} />
      </div>

      <div hidden={step !== 2} className="mt-6 space-y-7">
        <div className="grid gap-7 sm:grid-cols-2">
          <Text name="name" label={f.name.label} error={message('name')} autoComplete="name" />
          <Text name="title" label={f.title.label} placeholder={f.title.placeholder} optional={t.optional} autoComplete="organization-title" />
        </div>
        <div className="grid gap-7 sm:grid-cols-2">
          <Text name="whatsapp" label={f.whatsapp.label} placeholder={f.whatsapp.placeholder} error={message('whatsapp')} type="tel" autoComplete="tel" />
          <Text name="email" label={f.email.label} optional={t.optional} error={message('email')} type="email" autoComplete="email" />
        </div>
        <Choice name="lang" label={f.lang.label} options={f.lang.options} defaultValue={locale} />
        <label className="flex cursor-pointer items-start gap-3 text-[15px] leading-relaxed">
          <input type="checkbox" name="consent" value="yes" className="mt-1 size-5 shrink-0 cursor-pointer accent-teal" />
          <span>
            {f.consent.label}
            {message('consent') && <span className="mt-1 block text-[13px] text-alert">{message('consent')}</span>}
          </span>
        </label>
      </div>

      {step === 3 && snapshot && <Review locale={locale} data={snapshot} onEdit={setStep} />}

      {errors.form && <p className="mt-6 rounded-2xl bg-alert/[0.06] p-4 text-[14px] text-alert">{t.failed}</p>}

      <div className="mt-10 flex items-center justify-between gap-3 border-t border-rule pt-6">
        {step > 0 ? (
          <button type="button" onClick={() => setStep((s) => s - 1)} className={secondary}>
            {t.back}
          </button>
        ) : (
          <span />
        )}
        {step < 3 ? (
          <button type="button" onClick={next} className={primary}>
            {t.next}
            <Arrow className="size-4" />
          </button>
        ) : (
          <button type="submit" disabled={pending} aria-busy={pending} className={`${primary} disabled:opacity-60`}>
            {pending ? t.sending : t.submit}
          </button>
        )}
      </div>
    </form>
  );
}

function Text(props: {
  name: string;
  label: string;
  placeholder?: string;
  optional?: string;
  error?: string;
  type?: string;
  autoComplete?: string;
}) {
  const id = `pilot-${props.name}`;
  return (
    <div>
      <label htmlFor={id} className="text-[14px] font-medium">
        {props.label}
        {props.optional && <span className="ml-1.5 font-normal text-muted">({props.optional})</span>}
      </label>
      <input
        id={id}
        name={props.name}
        type={props.type ?? 'text'}
        placeholder={props.placeholder}
        autoComplete={props.autoComplete}
        aria-invalid={props.error ? true : undefined}
        aria-describedby={props.error ? `${id}-error` : undefined}
        className={`mt-2 h-12 w-full rounded-2xl bg-canvas px-4 text-[15px] ring-1 placeholder:text-muted/60 focus:bg-paper ${
          props.error ? 'ring-alert/60' : 'ring-rule'
        } ${focus}`}
      />
      {props.error && (
        <p id={`${id}-error`} className="mt-1.5 text-[13px] text-alert">
          {props.error}
        </p>
      )}
    </div>
  );
}

function Choice(props: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  multiple?: boolean;
  error?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <fieldset aria-describedby={props.error ? `pilot-${props.name}-error` : undefined}>
      <legend className="text-[14px] font-medium">{props.label}</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {props.options.map((option) => (
          <label
            key={option.value}
            className="cursor-pointer rounded-full bg-canvas px-4 py-2.5 text-[14px] ring-1 ring-rule transition-colors duration-150 hover:ring-teal/50 has-checked:bg-deep has-checked:text-paper has-checked:ring-deep has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-teal"
          >
            <input
              type={props.multiple ? 'checkbox' : 'radio'}
              name={props.name}
              value={option.value}
              defaultChecked={option.value === props.defaultValue}
              onChange={(e) => props.onChange?.(e.target.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
      {props.error && (
        <p id={`pilot-${props.name}-error`} className="mt-2 text-[13px] text-alert">
          {props.error}
        </p>
      )}
    </fieldset>
  );
}

/** Son adım: verilen cevapların özeti, her bölümün yanında düzenle bağlantısı. */
function Review({ locale, data, onEdit }: { locale: Locale; data: FormData; onEdit: (step: number) => void }) {
  const t = copy[locale].pilot;
  const f = t.fields;
  const labelOf = (key: keyof typeof f, value: string) => {
    const field = f[key] as { options?: { value: string; label: string }[] };
    return field.options?.find((o) => o.value === value)?.label ?? value;
  };
  const show = (key: keyof typeof f) => {
    const values = data.getAll(key).map(String).filter(Boolean);
    return values.map((v) => labelOf(key, v)).join(', ');
  };

  const groups: { step: number; rows: (keyof typeof f)[] }[] = [
    { step: 0, rows: ['role', 'org', 'city', 'treatments', 'web', 'clinics'] },
    { step: 1, rows: ['method', 'share', 'volume', 'refund', 'chargeback', 'lost'] },
    { step: 2, rows: ['name', 'title', 'whatsapp', 'email', 'lang'] },
  ];

  return (
    <div className="mt-6 space-y-4">
      {groups.map((group) => (
        <div key={group.step} className="rounded-2xl bg-canvas p-5 ring-1 ring-rule/70">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[13px] font-medium text-muted">{t.stepNames[group.step]}</p>
            <button type="button" onClick={() => onEdit(group.step)} className={`rounded text-[13px] font-medium text-held hover:text-deep ${focus}`}>
              {t.reviewEdit}
            </button>
          </div>
          <dl className="mt-3 space-y-2 text-[14px]">
            {group.rows
              .filter((key) => show(key))
              .map((key) => (
                <div key={key} className="grid gap-1 sm:grid-cols-[14rem_1fr] sm:gap-4">
                  <dt className="text-muted">{f[key].label}</dt>
                  <dd>{show(key)}</dd>
                </div>
              ))}
          </dl>
        </div>
      ))}
    </div>
  );
}
