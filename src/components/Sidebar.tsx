import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Map, CloudRain, Cloud, Thermometer, Wind, Zap, Tornado, Navigation, X, CalendarDays } from 'lucide-react';
import { useWeatherStore, LayerState } from '../store/useWeatherStore';

const LAYER_CONFIG: { key: keyof LayerState; label: string; icon: React.FC<any> }[] = [
  { key: 'meteo', label: 'Radar meteo', icon: CloudRain },
  { key: 'rain', label: 'Radar pioggia', icon: CloudRain },
  { key: 'satellite', label: 'Nuvole / satellite', icon: Cloud },
  { key: 'temperature', label: 'Radar temperature', icon: Thermometer },
  { key: 'wind', label: 'Radar vento', icon: Wind },
  { key: 'lightning', label: 'Radar fulmini', icon: Zap },
  { key: 'tornado', label: 'Tornado & Cicloni', icon: Tornado },
];

const QUICK_FLY = [
  { label: 'Mondo', center: [20, 0] as [number, number], zoom: 2 },
  { label: 'Europa', center: [54, 15] as [number, number], zoom: 4 },
  { label: 'Italia', center: [42, 12] as [number, number], zoom: 6 },
  { label: 'S.Teresa', center: [37.95, 15.37] as [number, number], zoom: 12 },
];

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const { layers, toggleLayer, setMapCenter, setMapZoom, activePanel, setActivePanel } = useWeatherStore();
  const [search, setSearch] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=json&limit=1`,
        { headers: { 'User-Agent': 'TFRWeatherApp/1.0' } }
      );
      const data = await res.json();
      if (data?.[0]) {
        setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        setMapZoom(10);
        onClose?.();
      }
    } catch {
      // silently ignore
    }
  };

  return (
    <div className="h-full flex flex-col font-sans">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-sidebar-border flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-sidebar-primary flex items-center gap-2">
            <Navigation className="w-4 h-4 sm:w-5 sm:h-5" />
            The Final Radar
          </h1>
          <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider font-mono">francescoscandurra11</p>
        </div>
        {/* Close button — visible only on mobile (rendered by parent overlay) */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-2 text-muted-foreground hover:bg-accent/20 rounded-full transition-colors"
            data-testid="button-close-sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search + Quick fly */}
      <div className="p-4 border-b border-sidebar-border">
        <form onSubmit={handleSearch} className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Cerca località..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-sidebar-accent border border-sidebar-border rounded-md py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-sidebar-primary focus:ring-1 focus:ring-sidebar-primary transition-all text-sidebar-foreground"
            data-testid="input-city-search"
          />
        </form>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {QUICK_FLY.map((loc) => (
            <button
              key={loc.label}
              onClick={() => {
                setMapCenter(loc.center);
                setMapZoom(loc.zoom);
                onClose?.();
              }}
              className="text-xs py-1.5 px-2 bg-sidebar-accent/50 hover:bg-sidebar-accent rounded border border-sidebar-border/50 text-left truncate transition-colors"
              data-testid={`button-quickfly-${loc.label.toLowerCase().replace(/\s/g, '-')}`}
            >
              {loc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Layers + panels */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3 ml-1">Livelli Mappa</div>

        {LAYER_CONFIG.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            data-testid={`button-layer-${key}`}
            onClick={() => {
              toggleLayer(key);
              if (key === 'tornado' && !layers.tornado) setActivePanel('severe');
              if (key === 'tornado' && layers.tornado) setActivePanel(null);
              onClose?.();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all text-sm ${
              layers[key]
                ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium'
                : 'text-sidebar-foreground hover:bg-sidebar-accent'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{label}</span>
          </button>
        ))}

        <div className="h-px bg-sidebar-border my-3 mx-2" />

        {/* Hourly forecast */}
        <button
          data-testid="button-panel-forecast"
          onClick={() => { setActivePanel('forecast'); onClose?.(); }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all text-sm border ${
            activePanel === 'forecast'
              ? 'bg-sidebar-accent border-sidebar-primary text-sidebar-foreground font-medium'
              : 'border-transparent text-sidebar-foreground hover:bg-sidebar-accent'
          }`}
        >
          <Map className="w-4 h-4 shrink-0" />
          <span>Previsioni Orarie</span>
        </button>

        {/* Weekly forecast */}
        <button
          data-testid="button-panel-weekly"
          onClick={() => { setActivePanel('weekly'); onClose?.(); }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all text-sm border ${
            activePanel === 'weekly'
              ? 'bg-sidebar-accent border-sidebar-primary text-sidebar-foreground font-medium'
              : 'border-transparent text-sidebar-foreground hover:bg-sidebar-accent'
          }`}
        >
          <CalendarDays className="w-4 h-4 shrink-0" />
          <span>Previsioni Settimana</span>
        </button>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/20">
        <div className="text-[10px] text-muted-foreground space-y-0.5 font-mono">
          <div>Dati radar: RainViewer</div>
          <div>Previsioni: Open-Meteo</div>
        </div>
      </div>
    </div>
  );
}
