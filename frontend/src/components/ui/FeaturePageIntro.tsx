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
    <header className="py-2 sm:py-3">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-2xl">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-[0_10px_18px_-13px_rgba(5,150,105,0.9)]"><Icon name={icon} className="text-[24px]" /></span>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">{eyebrow}</p>
          <h1 className="mt-1.5 text-3xl font-semibold leading-tight tracking-[0.01em] text-slate-950 dark:text-white sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">{description}</p>
        </div>
        {children && <div className="flex shrink-0 items-center">{children}</div>}
      </div>
    </header>
  );
}
