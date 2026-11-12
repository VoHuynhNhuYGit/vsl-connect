import { useId } from 'react';
import vietnamLandscapes from '../../assets/heritage-landscapes.webp';

/** Decorative travel montage: rice terraces, Hạ Long Bay and Hồ Gươm. */
export function HeritageArtwork({ className = '' }: { className?: string }) {
  const lightId = `heritage-light-${useId().replace(/:/g, '')}`;
  return <svg viewBox="0 0 640 470" className={`heritage-art ${className}`} aria-hidden="true" focusable="false">
    <defs>
      <radialGradient id={lightId}>
        <stop stopColor="#f2c461" stopOpacity=".3" />
        <stop offset="1" stopColor="#f2c461" stopOpacity="0" />
      </radialGradient>
    </defs>
    <path d="M52 251C52 119 165 51 320 56c159 4 273 73 269 202-4 117-124 172-275 168S49 373 52 251Z" fill="var(--heritage-art-paper, #f3ebd3)" />
    <ellipse className="heritage-sunlight" cx="285" cy="155" rx="195" ry="130" fill={`url(#${lightId})`} />
    <g fill="var(--heritage-cloud-color, #fffaf0)" opacity=".6">
      <path className="heritage-cloud" d="M95 92q5-16 21-11 11-22 30-7 23-6 26 18Z" />
      <path className="heritage-cloud heritage-cloud--two" d="M456 88q7-18 23-11 12-23 30-8 21-5 26 19Z" />
    </g>
    <image className="heritage-scene" href={vietnamLandscapes} x="10" y="44" width="620" height="395" preserveAspectRatio="xMidYMid meet" />
    <g className="heritage-ripples" fill="none" stroke="#558e95" strokeWidth="1.5" strokeLinecap="round" opacity=".55">
      <path d="M96 416q24 4 48 0m13 0q24 4 48 0m226 0q24 4 48 0M175 429q23 4 47 0m153 0q23 4 47 0" />
    </g>
    <g className="heritage-reflection" fill="none" stroke="#dbac52" strokeWidth="2" strokeLinecap="round" opacity=".5">
      <path d="M282 401h18m-24 7h28m-19 7h14m7 9h13" />
    </g>
    <g className="heritage-leaves" fill="#5b7f58" opacity=".55">
      <path d="M557 107q17 6 14 28-14-8-14-28Zm9 33q17 6 14 28-14-8-14-28Zm-20-16q-17 6-14 28 14-8 14-28Z" />
    </g>
    <path d="M259 451h122" stroke="#c59421" opacity=".55" />
  </svg>;
}
