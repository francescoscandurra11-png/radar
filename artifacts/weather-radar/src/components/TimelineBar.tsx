import { useEffect, useRef } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useWeatherStore } from '../store/useWeatherStore';
import { useRainViewer } from '../hooks/useRainViewer';

export default function TimelineBar() {
  const { radarOpacity, setRadarOpacity, playbackState, setPlaybackState } = useWeatherStore();
  const { data: rainData } = useRainViewer();
  const timerRef = useRef<number | null>(null);

  const frames = rainData?.radar?.past || [];
  const maxIndex = Math.max(0, frames.length - 1);
  const currentFrameIndex = Math.min(playbackState.frameIndex, maxIndex);
  const currentFrame = frames[currentFrameIndex];

  // Auto-pause if data goes missing
  useEffect(() => {
    if (!frames.length && playbackState.playing) {
      setPlaybackState({ playing: false });
    }
  }, [frames.length, playbackState.playing, setPlaybackState]);

  // Playback loop
  useEffect(() => {
    if (playbackState.playing && frames.length > 0) {
      timerRef.current = window.setInterval(() => {
        setPlaybackState({
          frameIndex: (useWeatherStore.getState().playbackState.frameIndex + 1) % frames.length,
        });
      }, 500);
    } else {
      if (timerRef.current !== null) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current !== null) clearInterval(timerRef.current); };
  }, [playbackState.playing, frames.length, setPlaybackState]);

  const togglePlay = () => setPlaybackState({ playing: !playbackState.playing });

  const step = (dir: 1 | -1) => {
    setPlaybackState({ playing: false });
    let next = currentFrameIndex + dir;
    if (next < 0) next = maxIndex;
    if (next > maxIndex) next = 0;
    setPlaybackState({ frameIndex: next });
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlaybackState({ playing: false, frameIndex: parseInt(e.target.value, 10) });
  };

  // Responsive time labels
  const shortTime = currentFrame
    ? format(new Date(currentFrame.time * 1000), 'HH:mm')
    : '--:--';
  const longTime = currentFrame
    ? format(new Date(currentFrame.time * 1000), 'EEE HH:mm', { locale: it })
    : '---';

  return (
    <div className="fixed bottom-0 left-0 md:left-[240px] right-0 z-40 bg-card/97 backdrop-blur-xl border-t border-border shadow-[0_-8px_32px_rgba(0,0,0,0.5)] font-sans">
      {/* Single responsive row */}
      <div className="flex items-center gap-2 px-3 sm:px-4 h-[56px]">

        {/* ── Play controls ── */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => step(-1)}
            disabled={!frames.length}
            aria-label="Frame precedente"
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-accent/20 text-foreground transition-colors disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            disabled={!frames.length}
            aria-label={playbackState.playing ? 'Pausa' : 'Riproduci'}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-transform active:scale-95 disabled:opacity-40 shrink-0"
          >
            {playbackState.playing
              ? <Pause className="w-4 h-4 fill-current" />
              : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          <button
            onClick={() => step(1)}
            disabled={!frames.length}
            aria-label="Frame successivo"
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-accent/20 text-foreground transition-colors disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* ── Time display (short on mobile, long on sm+) ── */}
        <div className="font-mono font-bold text-primary tracking-wider shrink-0 text-xs sm:text-sm leading-none w-[38px] sm:w-auto text-center sm:text-left">
          <span className="sm:hidden">{shortTime}</span>
          <span className="hidden sm:inline uppercase">{longTime}</span>
        </div>

        {/* ── Scrubber (takes remaining space) ── */}
        <div className="flex-1 flex items-center gap-1.5 sm:gap-3 min-w-0">
          <span className="text-[9px] sm:text-[10px] font-mono text-muted-foreground shrink-0">-2h</span>
          <input
            type="range"
            min="0"
            max={maxIndex}
            value={currentFrameIndex}
            onChange={handleSliderChange}
            disabled={!frames.length}
            className="flex-1 h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full
              disabled:opacity-40"
          />
          <span className="text-[9px] sm:text-[10px] font-mono text-primary font-bold shrink-0">ORA</span>
        </div>

        {/* ── Opacity (hidden on mobile, shown sm+) ── */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Opacità</span>
          <input
            type="range"
            min="0"
            max="100"
            value={radarOpacity}
            onChange={(e) => setRadarOpacity(parseInt(e.target.value, 10))}
            className="w-20 h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>

        {/* ── Frame count (hidden on mobile) ── */}
        <div className="text-[9px] text-muted-foreground font-mono text-right hidden lg:block shrink-0">
          {frames.length}pt<br />
          {format(new Date(), 'HH:mm')}
        </div>

      </div>
    </div>
  );
}
