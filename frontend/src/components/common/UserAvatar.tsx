import { useEffect, useState } from 'react';

export function UserAvatar({ name, src, className = 'h-10 w-10', label }: { name: string; src?: string | null; className?: string; label?: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const initials = name.trim().split(/\s+/).slice(-2).map(part => part[0]).join('').toLocaleUpperCase('vi-VN') || 'HV';
  return <span className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary-container font-bold text-on-secondary-container ${className}`} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
    {src && !failed ? <img src={src} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} /> : <span aria-hidden="true">{initials}</span>}
  </span>;
}
