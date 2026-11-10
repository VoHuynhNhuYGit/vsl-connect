import type { ReactNode } from 'react';
import { Icon } from './Icon';
import { useTheme } from '../../context/ThemeContext';
import { ThemeArtwork } from '../common/ThemeArtwork';
import { AnimatedBackdrop } from '../common/AnimatedBackdrop';

type FeaturePageBannerProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: string;
  children?: ReactNode;
};

export function FeaturePageBanner({ eyebrow, title, description, icon, children }: FeaturePageBannerProps) {
  const { siteTheme } = useTheme();
  return (
    <section className="feature-page-banner relative isolate overflow-hidden border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-teal-50 dark:border-emerald-400/10 dark:from-emerald-950/45 dark:via-slate-950 dark:to-teal-950/35">
      <AnimatedBackdrop variant="banner" />
      <div aria-hidden="true" className="theme-banner-art pointer-events-none absolute inset-0 overflow-hidden">
        <ThemeArtwork theme={siteTheme} className="absolute -bottom-9 right-4 hidden h-56 w-80 opacity-25 lg:block" />
        <div className="absolute -right-20 bottom-[-7rem] h-52 w-[46rem] rounded-[50%] bg-emerald-200/70 blur-2xl dark:bg-emerald-400/10" />
        <div className="absolute right-[15%] top-[-12rem] h-64 w-64 rounded-full bg-teal-100/80 blur-3xl dark:bg-teal-400/5" />
      </div>
      <div className="feature-banner-content relative mx-auto flex min-h-[152px] max-w-[1440px] flex-wrap items-center justify-between gap-5 px-5 py-8 sm:px-8 lg:px-12 xl:px-16">
        <div className="flex max-w-2xl items-center gap-5">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-[0_10px_20px_-17px_rgba(5,150,105,0.75)] dark:bg-emerald-400/10 dark:text-emerald-300"><Icon name={icon} className="text-[32px]" /></span>
          <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">{eyebrow}</p><h1 className="mt-1.5 text-3xl font-semibold tracking-[0.01em] text-slate-950 dark:text-white sm:text-4xl">{title}</h1><p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">{description}</p></div>
        </div>
        {children && <div className="flex shrink-0 items-center">{children}</div>}
      </div>
    </section>
  );
}
