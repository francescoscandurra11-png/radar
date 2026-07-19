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
    <div className="fixed bottom-0 left-0 md:left-[240px] right-0 z-40 bg-[#070b14]/96 backdrop-blur-xl border-t border-cyan-400/15 shadow-[0_-8px_32px_rgba(0,0,0,0.55)] font-sans">
      {/* Single responsive row */}
      <div className="flex items-center gap-2 px-3 sm:px-4 h-[56px]">

        {/* ── Play controls ── */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => step(-1)}
            disabled={!frames.length}
            aria-label="Frame precedente"
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-cyan-500/15 text-white/70 hover:text-cyan-300 transition-all duration-300 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            disabled={!frames.length}
            aria-label={playbackState.playing ? 'Pausa' : 'Riproduci'}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-cyan-500 text-[#05080f] hover:bg-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.35)] transition-all duration-300 active:scale-95 disabled:opacity-40 shrink-0"
          >
            {playbackState.playing
              ? <Pause className="w-4 h-4 fill-current" />
              : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          <button
            onClick={() => step(1)}
            disabled={!frames.length}
            aria-label="Frame successivo"
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-cyan-500/15 text-white/70 hover:text-cyan-300 transition-all duration-300 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* ── Time display ── */}
        <div className="font-mono font-bold text-cyan-300 tracking-wider shrink-0 text-xs sm:text-sm leading-none w-[38px] sm:w-auto text-center sm:text-left">
          <span className="sm:hidden">{shortTime}</span>
          <span className="hidden sm:inline uppercase">{longTime}</span>
        </div>

        {/* ── Scrubber ── */}
        <div className="flex-1 flex items-center gap-1.5 sm:gap-3 min-w-0">
          <span className="text-[9px] sm:text-[10px] font-mono text-white/40 shrink-0">-2h</span>
          <input
            type="range"
            min="0"
            max={maxIndex}
            value={currentFrameIndex}
            onChange={handleSliderChange}
            disabled={!frames.length}
            className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
              [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:shadow-[0_0_10px_#22d3ee]
              disabled:opacity-40"
          />
          <span className="text-[9px] sm:text-[10px] font-mono text-cyan-300 font-bold shrink-0">ORA</span>
        </div>

        {/* ── Opacity ── */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-white/40 font-mono uppercase tracking-wider">Opacità</span>
          <input
            type="range"
            min="0"
            max="100"
            value={radarOpacity}
            onChange={(e) => setRadarOpacity(parseInt(e.target.value, 10))}
            className="w-20 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
              [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:shadow-[0_0_10px_#22d3ee]"
          />
        </div>

        {/* ── Frame count ── */}
        <div className="text-[9px] text-white/40 font-mono text-right hidden lg:block shrink-0 uppercase tracking-wider">
          {frames.length} FRAMES<br />
          SYNC {format(new Date(), 'HH:mm')}
        </div>

      </div>
    </div>
  );
}
