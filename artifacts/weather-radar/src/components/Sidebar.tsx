import { useState } from 'react';
import { Search, Map, CloudRain, Cloud, Thermometer, Wind, Zap, Plane, Tornado, Navigation } from 'lucide-react';
import { useWeatherStore, LayerState } from '../store/useWeatherStore';

const LAYER_CONFIG: { key: keyof LayerState; label: string; icon: React.FC<any> }[] = [
  { key: 'meteo', label: 'Radar meteo', icon: CloudRain },
  { key: 'rain', label: 'Radar pioggia', icon: CloudRain },
  { key: 'satellite', label: 'Nuvole / satellite', icon: Cloud },
  { key: 'temperature', label: 'Radar temperature', icon: Thermometer },
  { key: 'wind', label: 'Radar vento', icon: Wind },
  { key: 'lightning', label: 'Radar fulmini', icon: Zap },
  { key: 'flights', label: 'Voli in tempo reale', icon: Plane },
  { key: 'tornado', label: 'Tornado & Cicloni', icon: Tornado },
];

const QUICK_FLY = [
  { label: 'Mondo', center: [20, 0] as [number, number], zoom: 2 },
  { label: 'Europa', center: [54, 15] as [number, number], zoom: 4 },
  { label: 'Italia', center: [42, 12] as [number, number], zoom: 6 },
  { label: 'Santa Teresa', center: [41.22, 9.19] as [number, number], zoom: 12 },
];

export default function Sidebar() {
  const { layers, toggleLayer, setMapCenter, setMapZoom, activePanel, setActivePanel } = useWeatherStore();
  const [search, setSearch] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=json&limit=1`, {
        headers: {
          'User-Agent': 'TFRWeatherApp/1.0'
        }
      });
      const data = await res.json();
      if (data && data[0]) {
        setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        setMapZoom(10);
      }
    } catch (e) {
      console.error('Search failed', e);
    }
  };

  return (
    <div className="fixed top-0 left-0 h-[100dvh] w-[240px] bg-sidebar/95 backdrop-blur-xl border-r border-sidebar-border z-40 flex flex-col font-sans">
      <div className="p-5 border-b border-sidebar-border">
        <h1 className="text-xl font-bold tracking-tight text-sidebar-primary flex items-center gap-2">
          <Navigation className="w-5 h-5" />
          TFR Weather
        </h1>
        <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-mono">Professional Pro</p>
      </div>

      <div className="p-4 border-b border-sidebar-border">
        <form onSubmit={handleSearch} className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cerca località..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-sidebar-accent border border-sidebar-border rounded-md py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-sidebar-primary focus:ring-1 focus:ring-sidebar-primary transition-all text-sidebar-foreground"
          />
        </form>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {QUICK_FLY.map((loc) => (
            <button
              key={loc.label}
              onClick={() => {
                setMapCenter(loc.center);
                setMapZoom(loc.zoom);
              }}
              className="text-xs py-1.5 px-2 bg-sidebar-accent/50 hover:bg-sidebar-accent rounded border border-sidebar-border/50 text-left truncate transition-colors"
            >
              {loc.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3 ml-1">Livelli Mappa</div>
        
        {LAYER_CONFIG.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => {
              toggleLayer(key);
              if (key === 'tornado' && !layers.tornado) setActivePanel('severe');
              if (key === 'flights' && !layers.flights) setActivePanel('flights');
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all text-sm ${
              layers[key] 
                ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium' 
                : 'text-sidebar-foreground hover:bg-sidebar-accent'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}

        <div className="h-px bg-sidebar-border my-4 mx-2"></div>
        
        <button
          onClick={() => setActivePanel('forecast')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all text-sm border ${
            activePanel === 'forecast'
              ? 'bg-sidebar-accent border-sidebar-primary text-sidebar-foreground font-medium' 
              : 'border-transparent text-sidebar-foreground hover:bg-sidebar-accent'
          }`}
        >
          <Map className="w-4 h-4" />
          <span>Previsioni (Forecast)</span>
        </button>
      </div>

      <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/20">
        <div className="text-[10px] text-muted-foreground space-y-1 font-mono">
          <div>Dati radar: RainViewer</div>
          <div>Previsioni: Open-Meteo</div>
          <div>Voli: OpenSky Network</div>
        </div>
      </div>
    </div>
  );
}
