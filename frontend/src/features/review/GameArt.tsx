import { Icon } from '../../components/ui/Icon';
import type { GameMode } from './gameLogic';

export function GameArt({ mode }: { mode: GameMode }) {
  return <div className={`review-game-art review-game-art--${mode}`} aria-hidden="true">
    <span className="review-art-orbit" />
    {mode === 'blocks' && <div className="review-art-blocks">{Array.from({ length: 20 }, (_, index) => <span key={index} data-cell={index} />)}</div>}
    {mode === 'match' && <div className="review-art-match"><span><Icon name="sign_language" /></span><span><Icon name="auto_stories" /></span><span><Icon name="check" /></span><span><Icon name="sign_language" /></span></div>}
    {mode === 'blast' && <><span className="review-art-asteroid review-art-asteroid--one"><Icon name="star" /></span><span className="review-art-asteroid review-art-asteroid--two"><Icon name="check" /></span><span className="review-art-asteroid review-art-asteroid--three" /><span className="review-art-rocket"><Icon name="rocket_launch" /></span></>}
    <span className="review-art-spark review-art-spark--one">✦</span><span className="review-art-spark review-art-spark--two">+</span>
  </div>;
}
