import dongHoVillage from '../../assets/dongho-village.webp';

/** Decorative folk-art scene shared by the hero, theme picker and page banners. */
export function DongHoArtwork({ className = '' }: { className?: string }) {
  return <svg viewBox="0 0 640 460" className={`dongho-art ${className}`} aria-hidden="true" focusable="false">
    <ellipse cx="322" cy="236" rx="272" ry="192" fill="var(--dongho-art-paper, #f4e6bd)" />
    <ellipse cx="322" cy="236" rx="259" ry="180" fill="none" stroke="#ba8735" strokeWidth="1" opacity=".4" />
    <circle cx="483" cy="110" r="49" fill="#dca337" opacity=".22" />
    <g className="dongho-bamboo" fill="none" stroke="#557548" strokeWidth="2" opacity=".35">
      <path d="M67 337Q88 200 64 94M87 338q22-131 21-214M64 144l-18-15m21 50 20-16m-18 54-22-13m21 50 20-14m17-53 17-15m-18 57-18-12" />
      <path d="M64 114q-25-21-28-4 11 10 28 4Zm42 36q20-29 29-16-6 13-29 16Z" fill="#557548" stroke="none" />
    </g>
    <image className="dongho-scene" href={dongHoVillage} x="8" y="35" width="624" height="380" preserveAspectRatio="xMidYMid meet" />
    <g fill="#aa402b" opacity=".65">
      <path className="dongho-petal dongho-petal--one" d="M108 91q21-17 24 2-12 14-24-2Z" />
      <path className="dongho-petal dongho-petal--two" d="M531 257q21-17 24 2-12 14-24-2Z" />
      <path className="dongho-petal dongho-petal--three" d="M340 63q15-12 18 2-10 10-18-2Z" />
    </g>
    <g fill="#c39229" opacity=".7"><circle cx="164" cy="58" r="3" /><circle cx="578" cy="179" r="3" /><circle cx="77" cy="280" r="2" /></g>
    <path d="M170 422h300m-246 8h192" stroke="#ba8735" opacity=".4" strokeLinecap="round" />
  </svg>;
}
