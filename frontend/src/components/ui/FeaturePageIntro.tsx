import type { ReactNode } from 'react';
import { Icon } from './Icon';

type FeaturePageIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: string;
  children?: ReactNode;
};

export function FeaturePageIntro({ eyebrow, title, description, icon, children }: FeaturePageIntroProps) {
  return (
    <header className="relative isolate overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-5 py-7 shadow-[0_12px_30px_-28px_rgba(5,150,105,0.45)] dark:border-emerald-400/10 dark:from-emerald-950/45 dark:via-slate-950 dark:to-teal-950/35 sm:px-8 sm:py-9">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-emerald-200/70 blur-3xl dark:bg-emerald-400/10" />
        <div className="absolute bottom-0 right-[18%] h-24 w-72 rounded-[50%] bg-teal-100/75 blur-2xl dark:bg-teal-400/5" />
      </div>
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-2xl">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-[0_10px_18px_-13px_rgba(5,150,105,0.9)]"><Icon name={icon} className="text-[24px]" /></span>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">{eyebrow}</p>
          <h1 className="mt-1.5 text-3xl font-semibold leading-tight tracking-[0.01em] text-slate-950 dark:text-white sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">{description}</p>
        </div>
        {children && <div className="relative z-10 flex shrink-0 items-center">{children}</div>}
      </div>
    </header>
  );
}
