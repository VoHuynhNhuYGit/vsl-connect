import { useId } from 'react';
import type { SiteTheme } from '../../config/themes';
import heroLaptop from '../../assets/vsl-hero-laptop.png';

// Small vector emblems share the site's palette and stay sharp at every size.
export function ThemeArtwork({ theme, className = '' }: { theme: SiteTheme; className?: string }) {
  const id = useId().replace(/:/g, '');
  if (theme === 'default') return <img src={heroLaptop} alt="" aria-hidden="true" className={`object-contain ${className}`} />;
  return <svg viewBox="0 0 480 340" className={className} aria-hidden="true" focusable="false">
    <defs>
      <pattern id={`${id}-grain`} width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="2" cy="3" r="0.7" fill="currentColor" opacity="0.12" /><circle cx="9" cy="8" r="0.5" fill="currentColor" opacity="0.1" /></pattern>
    </defs>
    <circle cx="245" cy="165" r="133" fill="var(--art-soft)" />
    <circle cx="245" cy="165" r="119" fill="none" stroke="var(--art-gold)" strokeWidth="1" strokeDasharray="2 7" />
    {theme === 'patterns' && <g stroke="var(--art-ink)" strokeWidth="3" strokeLinejoin="round">
      <path d="M84 252V146h30v106m252 0V146h30v106" fill="var(--art-blue)" />
      <path d="M72 146Q120 153 153 111L240 73l87 38q33 42 81 35l-12 23H84Z" fill="var(--art-primary)" />
      <path d="M67 128q31 28 83-8l90-42 90 42q52 36 83 8-9 39-83 14l-90-32-90 32q-74 25-83-14Z" fill="var(--art-gold)" />
      <path d="M153 111q-4-29-20-31m194 31q4-29 20-31M240 78V56" fill="none" />
      <path d="M132 176h216v68H132z" fill="var(--art-paper)" />
      {[148, 212, 276].map(x => <path key={x} d={`M${x} 187h48v45h-16v-28h-16v28h-16z`} fill="var(--art-blue)" />)}
      <path d="M82 263h316v13H82z" fill="var(--art-primary)" />
      <g fill="var(--art-blue)"><path d="M53 91q-21-20-30 0-24-1-18 18h65q13-19-17-18Z" /><path d="M421 208q-21-20-30 0-24-1-18 18h65q13-19-17-18Z" /></g>
      <circle cx="240" cy="133" r="13" fill="var(--art-primary)" /><circle cx="240" cy="133" r="5" fill="var(--art-paper)" />
    </g>}
    {theme === 'puppets' && <g stroke="var(--art-ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      {[262, 279, 296].map((y,i) => <ellipse key={y} cx="240" cy={y} rx={150-i*20} ry="10" fill="none" stroke="var(--art-blue)" opacity={0.8-i*.15} />)}
      {[false, true].map((right) => <g key={String(right)} transform={right ? 'translate(480 0) scale(-1 1)' : undefined}>
        <path d="M157 154q-30-2-53-38l-19 14q15 57 59 61l-27 65h112l-23-64q40-11 55-47l-22-12q-16 26-41 24Z" fill="var(--art-primary)" />
        <path d="M151 167l26 26 22-31-2 93h-39Z" fill="var(--art-gold)" />
        <path d="M161 103q-1-31 29-31 33 0 31 31v22q-7 29-30 28-28-3-30-28Z" fill="var(--art-paper)" />
        <path d="M157 94V73h12l-4-18 19 8 10-23 11 24 20-6-7 17 8 18Z" fill="var(--art-blue)" />
        <path d="M171 111l7-2m23 0 7 2m-27 20q10 8 19-1" fill="none" />
        <circle cx="170" cy="123" r="4" fill="var(--art-primary)" stroke="none" /><circle cx="210" cy="123" r="4" fill="var(--art-primary)" stroke="none" />
        <path d="M88 130q-23-1-22-16 10-1 19 8m156 20q11-20 24-12-2 12-15 19" fill="var(--art-paper)" />
        <circle cx="181" cy="216" r="9" fill="var(--art-blue)" />
      </g>)}
    </g>}
    {theme === 'dongho' && <g stroke="var(--art-ink)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M210 171Q115 76 82 153q-17 40 48 83-9-69 80-65Z" fill="var(--art-blue)" />
      <path d="M205 173Q90 30 57 91q-13 32 48 91-28-72 100-9Z" fill="var(--art-primary)" />
      <path d="M207 175Q146 61 111 58q-41 12 2 64 42 4 94 53Z" fill="var(--art-gold)" />
      <path d="M176 183q-18 79 70 90 88 6 90-65l-40-43-5-39-37 3-9 44Z" fill="var(--art-gold)" />
      <path d="M275 136q-12-28 8-31-2-25 16-19 12-24 24-8 26-5 20 16 19 10 2 25l-15 22Z" fill="var(--art-primary)" />
      <path d="M265 132q49-29 65 9l-5 48-30-13Z" fill="var(--art-paper)" />
      <path d="M329 147l29 9-30 11" fill="var(--art-primary)" /><circle cx="313" cy="142" r="4" fill="var(--art-ink)" stroke="none" />
      <path d="M297 169q31 0 18 29-14 10-18-29Z" fill="var(--art-primary)" />
      <path d="M251 190q-71-24-49 39 39 33 77-6-39-3-28-33Z" fill="var(--art-blue)" />
      <path d="M219 208l30 16m-37-1 28 12" fill="none" stroke="var(--art-paper)" strokeWidth="2" />
      <path d="M234 271v23m35-24 7 23m-58 5 16-4 14 5m14 0 14-6 19 5" fill="none" />
      <path d="M369 234q-17-28-34 0 17 29 34 0Zm0 0q18-28 34 0-17 29-34 0Z" fill="var(--art-primary)" />
      <path d="M369 234q-26-18 0-35 28 18 0 35Zm0 0q-26 18 0 35 28-18 0-35Z" fill="var(--art-gold)" />
    </g>}
    {theme === 'heritage' && <g stroke="var(--art-ink)" strokeWidth="3" strokeLinejoin="round">
      <circle cx="356" cy="81" r="32" fill="var(--art-gold)" stroke="none" />
      <path d="M75 256h330v17H75z" fill="var(--art-gold)" />
      <path d="M129 239V139h210v100" fill="var(--art-paper)" />
      <path d="M112 139l122-52 123 52Z" fill="var(--art-primary)" /><path d="M126 146h218v12H126z" fill="var(--art-gold)" />
      {[146, 177, 269, 300].map(x => <path key={x} d={`M${x} 165h17v74h-17z`} fill="var(--art-primary)" />)}
      <path d="M212 239v-59q22-35 44 0v59" fill="var(--art-blue)" /><path d="M115 240h239v13H115z" fill="var(--art-primary)" />
      <path d="M65 253l13-125h28l12 125M71 128h42v-13H71zM85 114V71" fill="var(--art-blue)" /><path d="M86 71h43v28H86z" fill="var(--art-primary)" />
      <path d="m105 76 2 6h7l-5 4 2 7-6-4-5 4 2-7-5-4h6Z" fill="var(--art-gold)" stroke="none" />
      <path d="M368 252v-45h29v45m-34-47h39v-10h-39z" fill="var(--art-blue)" />
      <path d="M363 195q19-12 39 0" fill="none" /><path d="M376 185v-17h14v17z" fill="var(--art-gold)" />
      <path d="M373 168h20" fill="none" />
      <path d="M59 278h350" stroke="var(--art-primary)" />
    </g>}
    <path d="M35 44h18m-9-9v18m373 228h18m-9-9v18" stroke="var(--art-gold)" strokeWidth="3" />
    <circle cx="399" cy="49" r="5" fill="var(--art-primary)" /><circle cx="61" cy="221" r="4" fill="var(--art-blue)" />
    <circle cx="245" cy="165" r="133" fill={`url(#${id}-grain)`} opacity="0.3" />
  </svg>;
}
