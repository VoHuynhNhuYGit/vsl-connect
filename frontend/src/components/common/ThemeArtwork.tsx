import type { SiteTheme } from '../../config/themes';
import heroLaptop from '../../assets/vsl-hero-laptop.png';
import { DongHoArtwork } from './DongHoArtwork';
import { PatternsArtwork } from './PatternsArtwork';
import { PuppetsArtwork } from './PuppetsArtwork';
import { HeritageArtwork } from './HeritageArtwork';

// Each cultural theme shares its artwork across the hero, picker and banners.
export function ThemeArtwork({ theme, className = '' }: { theme: SiteTheme; className?: string }) {
  if (theme === 'default') return <img src={heroLaptop} alt="" aria-hidden="true" className={`object-contain ${className}`} />;
  if (theme === 'puppets') return <PuppetsArtwork className={className} />;
  if (theme === 'patterns') return <PatternsArtwork className={className} />;
  if (theme === 'dongho') return <DongHoArtwork className={className} />;
  return <HeritageArtwork className={className} />;
}
