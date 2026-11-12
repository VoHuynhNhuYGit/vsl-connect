import hueHeritage from '../../assets/hoasac-hue.webp';

function Lantern({ x, y, scale = 1, delay = 0 }: { x: number; y: number; scale?: number; delay?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <g className="patterns-lantern" style={{ animationDelay: `${delay}s` }}>
      <path d="M0 0v20" stroke="#75423e" strokeWidth="1.5" />
      <path d="M-8 19H8v5H-8zM-8 70H8v5H-8z" fill="#d4a84f" />
      <ellipse cy="47" rx="23" ry="25" fill="#bc4948" stroke="#843c42" strokeWidth="1.5" />
      <ellipse cy="47" rx="12" ry="25" fill="none" stroke="#ecc17b" strokeWidth="1" opacity=".7" />
      <path d="M0 23v48M-8 79v12m8-14v19m8-17v12" fill="none" stroke="#d4a84f" strokeWidth="1.5" />
      <path d="M-5 34q-8 7-7 16" fill="none" stroke="#f7dbb0" strokeWidth="2" opacity=".6" />
    </g>
  </g>;
}

/** Huế-inspired artwork with separate lanterns and water animation layers. */
export function PatternsArtwork({ className = '' }: { className?: string }) {
  return <svg viewBox="0 0 640 470" className={`patterns-art ${className}`} aria-hidden="true" focusable="false">
    <path d="M59 244C54 112 174 65 323 70c144-1 267 71 259 192-9 115-139 162-270 155C171 425 64 369 59 244Z" fill="var(--patterns-art-paper, #faefd9)" />
    <circle cx="460" cy="132" r="47" fill="#e0b565" opacity=".2" />
    <path d="M37 51Q173 100 319 52M369 47q106 38 232 0" fill="none" stroke="#8a4a4a" strokeWidth="1.5" opacity=".7" />
    <Lantern x={81} y={64} scale={.85} delay={-2} />
    <Lantern x={187} y={75} scale={.65} delay={-5} />
    <Lantern x={478} y={66} scale={.7} delay={-3} />
    <Lantern x={568} y={57} scale={.9} />
    <image className="patterns-scene" href={hueHeritage} x="15" y="101" width="610" height="340" preserveAspectRatio="xMidYMid meet" />
    <g className="patterns-water" fill="none" stroke="#508e8a" strokeWidth="1.5" strokeLinecap="round" opacity=".55">
      <path d="M67 424q21 5 43 0m12 0q22 5 44 0m14 0q22 5 43 0M82 432q16 4 32 0m15 0q16 4 32 0" />
    </g>
    <g fill="#b25b7a" opacity=".65">
      <path className="patterns-blossom" d="M40 214q12-15 18-1-4 13-18 1Z" />
      <path className="patterns-blossom patterns-blossom--two" d="M575 328q12-15 18-1-4 13-18 1Z" />
    </g>
    <path d="M253 448h134" stroke="#c99a45" strokeWidth="1" opacity=".6" />
    <path d="m315 448 5-5 5 5-5 5Z" fill="#c99a45" />
  </svg>;
}
