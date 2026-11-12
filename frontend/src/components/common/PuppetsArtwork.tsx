import { useId } from 'react';
import waterTheatre from '../../assets/puppets-water-theatre.webp';

/** Water-theatre scene with independent ripples and reflected stage lights. */
export function PuppetsArtwork({ className = '' }: { className?: string }) {
  const glowId = `puppets-glow-${useId().replace(/:/g, '')}`;
  return <svg viewBox="0 0 640 470" className={`puppets-art ${className}`} aria-hidden="true" focusable="false">
    <defs>
      <radialGradient id={glowId}>
        <stop stopColor="#edc16d" stopOpacity=".28" />
        <stop offset="1" stopColor="#edc16d" stopOpacity="0" />
      </radialGradient>
    </defs>
    <path d="M55 246C55 117 155 54 320 58s268 74 267 201c-2 120-117 170-270 165S54 373 55 246Z" fill="var(--puppets-art-paper, #dfefea)" />
    <ellipse className="puppets-stage-glow" cx="322" cy="231" rx="235" ry="185" fill={`url(#${glowId})`} />
    <path d="M89 148Q320 5 551 148" fill="none" stroke="#c1974f" strokeWidth="1" strokeDasharray="2 7" opacity=".5" />
    <image className="puppets-scene" href={waterTheatre} x="10" y="45" width="620" height="395" preserveAspectRatio="xMidYMid meet" />
    <g className="puppets-ripples" fill="none" stroke="#4d9f9a" strokeWidth="1.5" strokeLinecap="round">
      <path d="M96 408q27 5 54 0m13 0q20 5 41 0m250 0q26 5 53 0M122 419q27 4 53 0m236 0q27 4 54 0" />
      <path d="M244 433q27 4 54 0m15 0q27 4 54 0" opacity=".7" />
    </g>
    <g className="puppets-reflections" fill="none" stroke="#ebbc62" strokeWidth="2" strokeLinecap="round" opacity=".6">
      <path d="M259 375h15m-25 8h24m-15 8h12m78-10h20m-15 9h26m-23 7h13" />
    </g>
    <g fill="#ce9c44">
      <circle className="puppets-glint" cx="93" cy="178" r="2.5" />
      <circle className="puppets-glint puppets-glint--two" cx="555" cy="285" r="3" />
      <circle className="puppets-glint puppets-glint--three" cx="479" cy="77" r="2" />
    </g>
    <path d="M264 451h112" stroke="#bd9450" opacity=".55" />
  </svg>;
}
