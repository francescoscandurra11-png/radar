import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Plane, Search, ArrowUpDown, RefreshCw } from 'lucide-react';
import { useWeatherStore } from '../store/useWeatherStore';
import { useFlights } from '../hooks/useFlights';

type SortKey = 'callsign' | 'originCountry' | 'altitude' | 'velocity';

export default function FlightsPanel() {
  const { activePanel, setActivePanel, setMapCenter, setMapZoom } = useWeatherStore();
  const { data: flights, isLoading, isFetching } = useFlights();
  
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('altitude');
  const [sortDesc, setSortDesc] = useState(true);

  const isOpen = activePanel === 'flights';

  const filteredAndSorted = useMemo(() => {
    if (!flights) return [];
    
    let result = flights;
    
    if (search.trim()) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(f => 
        f.callsign.toLowerCase().includes(lowerSearch) || 
        f.originCountry.toLowerCase().includes(lowerSearch)
      );
    }

    return result.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];
      
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDesc ? valB.localeCompare(valA) : valA.localeCompare(valB);
      }
      
      valA = valA as number;
      valB = valB as number;
      return sortDesc ? valB - valA : valA - valB;
    });
  }, [flights, search, sortKey, sortDesc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDesc(!sortDesc);
    } else {
      setSortKey(key);
      setSortDesc(true); // Default to desc for new keys
    }
  };

  const totalCountries = useMemo(() => {
    if (!flights) return 0;
    return new Set(flights.map(f => f.originCountry)).size;
  }, [flights]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-0 bottom-[60px] right-0 w-[440px] bg-card/95 backdrop-blur-xl border-l border-border z-30 shadow-2xl flex flex-col font-sans"
        >
          <div className="flex items-center justify-between p-5 border-b border-border/50">
            <div className="flex items-center gap-3 text-primary">
              <Plane className="w-6 h-6" />
              <div>
                <h3 className="font-bold text-lg leading-none text-foreground">Selezione Voli</h3>
                <div className="text-xs font-mono text-muted-foreground mt-1 flex items-center gap-2">
                  <span className={isFetching ? 'animate-pulse text-primary' : ''}>
                    {flights?.length || 0} Tracciati
                  </span>
                  <span>•</span>
                  <span>{totalCountries} Nazioni</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setActivePanel(null)}
              className="p-2 text-muted-foreground hover:bg-accent/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 border-b border-border/50 bg-background/50">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cerca callsign o nazione..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-sidebar-accent border border-sidebar-border rounded-md py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
              />
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="grid grid-cols-4 gap-2 p-3 border-b border-border/50 text-xs font-mono text-muted-foreground uppercase bg-sidebar-accent/20">
              <button onClick={() => toggleSort('callsign')} className="flex items-center gap-1 hover:text-primary col-span-1 text-left">
                Volo <ArrowUpDown className="w-3 h-3" />
              </button>
              <button onClick={() => toggleSort('originCountry')} className="flex items-center gap-1 hover:text-primary col-span-1 text-left truncate">
                Origine <ArrowUpDown className="w-3 h-3" />
              </button>
              <button onClick={() => toggleSort('altitude')} className="flex items-center gap-1 hover:text-primary justify-end col-span-1">
                Alt <ArrowUpDown className="w-3 h-3" />
              </button>
              <button onClick={() => toggleSort('velocity')} className="flex items-center gap-1 hover:text-primary justify-end col-span-1">
                Vel <ArrowUpDown className="w-3 h-3" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoading && (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground font-mono text-sm gap-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                  Acquisizione radar...
                </div>
              )}
              
              {!isLoading && filteredAndSorted.length === 0 && (
                <div className="p-8 text-center text-muted-foreground font-mono text-sm">
                  Nessun volo corrispondente.
                </div>
              )}

              {filteredAndSorted.map((flight) => (
                <div 
                  key={flight.icao24}
                  onClick={() => {
                    setMapCenter([flight.lat, flight.lon]);
                    setMapZoom(9);
                  }}
                  className="grid grid-cols-4 gap-2 p-3 border-b border-border/10 hover:bg-sidebar-accent/50 cursor-pointer transition-colors text-sm font-mono items-center group"
                >
                  <div className="font-bold text-primary col-span-1 flex items-center gap-2">
                    <Plane className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" style={{ transform: `rotate(${flight.heading - 45}deg)` }} />
                    {flight.callsign}
                  </div>
                  <div className="truncate text-foreground/80 text-xs col-span-1" title={flight.originCountry}>
                    {flight.originCountry}
                  </div>
                  <div className="text-right text-foreground/90 col-span-1">
                    {Math.round(flight.altitude)}<span className="text-muted-foreground text-[10px]">m</span>
                  </div>
                  <div className="text-right text-foreground/90 col-span-1">
                    {Math.round(flight.velocity * 3.6)}<span className="text-muted-foreground text-[10px]">km/h</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
