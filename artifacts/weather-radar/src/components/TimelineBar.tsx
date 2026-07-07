import { useEffect, useRef } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useWeatherStore } from '../store/useWeatherStore';
import { useRainViewer } from '../hooks/useRainViewer';

export default function TimelineBar() {
  const { radarOpacity, setRadarOpacity, playbackState, setPlaybackState } = useWeatherStore();
  const { data: rainData } = useRainViewer();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Handle Playback Loop
  useEffect(() => {
    if (playbackState.playing && frames.length > 0) {
      timerRef.current = window.setInterval(() => {
        setPlaybackState({
          frameIndex: (useWeatherStore.getState().playbackState.frameIndex + 1) % frames.length
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

  const formattedTime = currentFrame 
    ? format(new Date(currentFrame.time * 1000), "EEEE HH:mm", { locale: it })
    : 'In attesa dati...';

  return (
    <div className="fixed bottom-0 left-[240px] right-0 h-[60px] bg-card/95 backdrop-blur-xl border-t border-border z-40 flex items-center px-6 justify-between font-sans shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      
      {/* Left controls */}
      <div className="flex items-center gap-6">
        <div className="font-mono text-primary font-bold text-sm tracking-widest uppercase min-w-[140px]">
          {formattedTime}
        </div>
        
        <div className="flex items-center gap-1">
          <button 
            onClick={() => step(-1)}
            disabled={!frames.length}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-accent/20 text-foreground transition-colors disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button 
            onClick={togglePlay}
            disabled={!frames.length}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-transform active:scale-95 disabled:opacity-50"
          >
            {playbackState.playing ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>
          
          <button 
            onClick={() => step(1)}
            disabled={!frames.length}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-accent/20 text-foreground transition-colors disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scrubber */}
      <div className="flex-1 mx-8 flex items-center gap-4">
        <span className="text-[10px] font-mono text-muted-foreground">-2h</span>
        <input 
          type="range" 
          min="0" 
          max={maxIndex} 
          value={currentFrameIndex}
          onChange={handleSliderChange}
          disabled={!frames.length}
          className="flex-1 h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full disabled:opacity-50"
        />
        <span className="text-[10px] font-mono text-primary font-bold tracking-widest">NOW</span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Opacità</span>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={radarOpacity}
            onChange={(e) => setRadarOpacity(parseInt(e.target.value, 10))}
            className="w-24 h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>
        
        <div className="text-[10px] text-muted-foreground font-mono text-right hidden lg:block">
          Dati visibili: 14pt<br />
          Aggiornato: {format(new Date(), 'HH:mm')}
        </div>
      </div>

    </div>
  );
}
