import type { PropsWithChildren } from 'react';

type SurfaceCardProps = PropsWithChildren<{ className?: string; as?: 'article' | 'section' | 'div' }>;

export function SurfaceCard({ children, className = '', as = 'article' }: SurfaceCardProps) {
  const Component = as;
  return <Component className={`rounded-xl bg-surface-container-lowest shadow-card ${className}`}>{children}</Component>;
}
