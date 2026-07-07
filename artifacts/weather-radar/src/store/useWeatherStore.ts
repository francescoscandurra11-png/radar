import { create } from 'zustand';

export interface LayerState {
  meteo: boolean;
  rain: boolean;
  satellite: boolean;
  temperature: boolean;
  wind: boolean;
  lightning: boolean;
  flights: boolean;
  tornado: boolean;
}

export type PanelType = 'forecast' | 'severe' | 'flights' | null;

interface WeatherStore {
  layers: LayerState;
  toggleLayer: (layer: keyof LayerState) => void;
  
  mapCenter: [number, number];
  mapZoom: number;
  setMapCenter: (center: [number, number]) => void;
  setMapZoom: (zoom: number) => void;
  
  activePanel: PanelType;
  setActivePanel: (panel: PanelType) => void;
  
  selectedLocation: { lat: number; lon: number; name: string } | null;
  setSelectedLocation: (loc: { lat: number; lon: number; name: string } | null) => void;
  
  radarOpacity: number;
  setRadarOpacity: (opacity: number) => void;
  
  playbackState: { playing: boolean; frameIndex: number };
  setPlaybackState: (state: Partial<{ playing: boolean; frameIndex: number }>) => void;
}

export const useWeatherStore = create<WeatherStore>((set) => ({
  layers: {
    meteo: true,
    rain: false,
    satellite: false,
    temperature: false,
    wind: false,
    lightning: false,
    flights: false,
    tornado: false,
  },
  toggleLayer: (layer) =>
    set((state) => ({ layers: { ...state.layers, [layer]: !state.layers[layer] } })),
    
  mapCenter: [20, 0],
  mapZoom: 2,
  setMapCenter: (center) => set({ mapCenter: center }),
  setMapZoom: (zoom) => set({ mapZoom: zoom }),
  
  activePanel: null,
  setActivePanel: (panel) => set((state) => ({ activePanel: state.activePanel === panel ? null : panel })),
  
  selectedLocation: null,
  setSelectedLocation: (loc) => set({ selectedLocation: loc, activePanel: loc ? 'forecast' : null }),
  
  radarOpacity: 75,
  setRadarOpacity: (opacity) => set({ radarOpacity: opacity }),
  
  playbackState: { playing: false, frameIndex: 0 },
  setPlaybackState: (state) =>
    set((s) => ({ playbackState: { ...s.playbackState, ...state } })),
}));
