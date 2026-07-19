import { useState } from 'react';
import { Search, Map, CloudRain, Cloud, Thermometer, Wind, Zap, Tornado, Send, X, CalendarDays } from 'lucide-react';
import { useWeatherStore, LayerState } from '../store/useWeatherStore';

const LAYER_CONFIG: { key: keyof LayerState; label: string; icon: React.FC<{ className?: string }> }[] = [
  { key: 'meteo', label: 'Radar Meteo', icon: CloudRain },
  { key: 'rain', label: 'Radar Pioggia', icon: CloudRain },
  { key: 'satellite', label: 'Nuvole / Satellite', icon: Cloud },
  { key: 'temperature', label: 'Temperature', icon: Thermometer },
  { key: 'wind', label: 'Radar Vento', icon: Wind },
  { key: 'lightning', label: 'Radar Fulmini', icon: Zap },
  { key: 'tornado', label: 'Tornado & Cicloni', icon: Tornado },
];

const QUICK_FLY = [
  { label: 'Mondo', center: [20, 0] as [number, number], zoom: 2 },
  { label: 'Europa', center: [48, 10] as [number, number], zoom: 4 },
  { label: 'Italia', center: [42, 12.5] as [number, number], zoom: 6 },
  { label: 'S. Teresa', center: [37.95, 15.37] as [number, number], zoom: 12 },
];

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const { layers, toggleLayer, setMapCenter, setMapZoom, activePanel, setActivePanel, mapCenter, mapZoom } =
    useWeatherStore();
  const [search, setSearch] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=json&limit=1`,
        { headers: { 'User-Agent': 'FinalRadar/2.4.1' } }
      );
      const data = await res.json();
      if (data?.[0]) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setMapCenter([lat, lon]);
        setMapZoom(11);
        useWeatherStore.getState().setSelectedLocation({
          lat,
          lon,
          name: data[0].display_name?.split(',')[0] || search,
        });
        onClose?.();
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="h-full flex flex-col font-sans bg-[#070b14]/95">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
        <div>
          <h1 className="text-base sm:text-lg font-bold tracking-[0.08em] text-white flex items-center gap-2 uppercase">
            <Send className="w-4 h-4 text-cyan-400 rotate-[-25deg]" />
            Final Radar
          </h1>
          <p className="text-[10px] mt-1 uppercase tracking-[0.2em] font-mono text-cyan-400/90 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
            SYS_ACTIVE
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300"
            data-testid="button-close-sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search + Quick fly */}
      <div className="p-4 border-b border-white/10">
        <form onSubmit={handleSearch} className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
          <input
            type="text"
            placeholder="Coordinate o località..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300"
            data-testid="input-city-search"
          />
        </form>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {QUICK_FLY.map((loc) => {
            const active =
              Math.abs(mapCenter[0] - loc.center[0]) < 0.8 &&
              Math.abs(mapCenter[1] - loc.center[1]) < 0.8 &&
              Math.abs(mapZoom - loc.zoom) <= 1;
            return (
              <button
                key={loc.label}
                onClick={() => {
                  setMapCenter(loc.center);
                  setMapZoom(loc.zoom);
                  if (loc.label === 'S. Teresa') {
                    useWeatherStore.getState().setSelectedLocation({
                      lat: 37.95,
                      lon: 15.37,
                      name: 'Santa Teresa di Riva',
                    });
                  }
                  onClose?.();
                }}
                className={`text-xs py-2 px-2.5 rounded-xl border text-left truncate transition-all duration-300 ease-out ${
                  active
                    ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                    : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-cyan-400/30 hover:text-white'
                }`}
                data-testid={`button-quickfly-${loc.label.toLowerCase().replace(/\s/g, '-')}`}
              >
                {loc.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Layers */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
        <div className="text-[10px] font-mono text-white/40 uppercase tracking-[0.18em] mb-3 ml-1">
          Layer Control
        </div>

        {LAYER_CONFIG.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            data-testid={`button-layer-${key}`}
            onClick={() => {
              toggleLayer(key);
              if (key === 'tornado' && !layers.tornado) setActivePanel('severe');
              if (key === 'tornado' && layers.tornado) setActivePanel(null);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-300 ease-out ${
              layers[key]
                ? 'bg-cyan-500/15 text-cyan-200 border border-cyan-400/40 shadow-[0_0_16px_rgba(34,211,238,0.15)]'
                : 'text-white/75 border border-transparent hover:bg-white/8 hover:text-white hover:border-white/10'
            }`}
          >
            <Icon className={`w-4 h-4 shrink-0 transition-colors duration-300 ${layers[key] ? 'text-cyan-300' : ''}`} />
            <span className="truncate flex-1 text-left">{label}</span>
            <span
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                layers[key]
                  ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]'
                  : 'bg-white/15'
              }`}
            />
          </button>
        ))}

        <div className="h-px bg-white/10 my-4 mx-1" />

        <div className="text-[10px] font-mono text-white/40 uppercase tracking-[0.18em] mb-3 ml-1">
          Analysis Panels
        </div>

        <button
          data-testid="button-panel-forecast"
          onClick={() => {
            setActivePanel('forecast');
            onClose?.();
          }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm border transition-all duration-300 ${
            activePanel === 'forecast'
              ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-200'
              : 'border-transparent text-white/75 hover:bg-white/8 hover:text-white'
          }`}
        >
          <Map className="w-4 h-4 shrink-0" />
          <span>Previsioni Orarie</span>
        </button>

        <button
          data-testid="button-panel-weekly"
          onClick={() => {
            setActivePanel('weekly');
            onClose?.();
          }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm border transition-all duration-300 ${
            activePanel === 'weekly'
              ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-200'
              : 'border-transparent text-white/75 hover:bg-white/8 hover:text-white'
          }`}
        >
          <CalendarDays className="w-4 h-4 shrink-0" />
          <span>Previsioni Settimana</span>
        </button>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10 bg-black/20">
        <div className="text-[10px] text-white/40 space-y-0.5 font-mono uppercase tracking-wider">
          <div>DATI: RainViewer</div>
          <div>PRV: Open-Meteo</div>
          <div className="text-cyan-400/80 pt-1">V 2.4.1 STABLE</div>
        </div>
      </div>
    </div>
  );
}
