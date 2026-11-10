import { useEffect, useRef, useState } from 'react';
import type { Sign } from '../../services/api';
import { Icon } from '../../components/ui/Icon';

type Props = { sign: Sign; number?: number; compact?: boolean; paused?: boolean; onReady?: (ready: boolean) => void; onViewed?: () => void };

export function SignVideo({ sign, number, compact = false, paused = false, onReady, onViewed }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const seen = useRef(false);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (paused) video.current?.pause();
    else if (!compact && loaded && !failed) void video.current?.play().catch(() => {});
  }, [paused, compact, loaded, failed]);

  return <div className={`review-video ${compact ? 'review-video--compact' : ''}`}>
    <video ref={video} src={sign.video_url ?? undefined} controls playsInline muted autoPlay={!compact && !paused} preload={compact ? 'none' : 'metadata'}
      aria-label={number === undefined ? 'Video câu hỏi ký hiệu' : `Video thẻ ${number}`}
      onLoadedData={() => { setLoaded(true); setFailed(false); onReady?.(true); }}
      onCanPlay={() => onReady?.(true)} onWaiting={() => onReady?.(false)}
      onError={() => { setFailed(true); setLoaded(false); onReady?.(false); }}
      onPlay={() => {
        if (paused) { video.current?.pause(); return; }
        video.current?.closest('.review-game')?.querySelectorAll('video').forEach(other => { if (other !== video.current) other.pause(); });
      }}
      onEnded={() => {
        if (!seen.current) { seen.current = true; onViewed?.(); }
        if (!compact && !paused && video.current) { video.current.currentTime = 0; void video.current.play().catch(() => {}); }
      }} />
    {!compact && !loaded && !failed && <span className="review-video-status" role="status">Đang tải video…</span>}
    {failed && <div className="review-video-error" role="alert"><Icon name="videocam_off" /><span>Không tải được video.</span><button type="button" onClick={() => { setFailed(false); video.current?.load(); }}>Thử lại video</button></div>}
  </div>;
}
