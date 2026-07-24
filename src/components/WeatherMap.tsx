import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { CloudRain, Wind, Thermometer } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

import { useWeatherStore } from '../store/useWeatherStore';
import { useRainViewer } from '../hooks/useRainViewer';
import { useCityTemperatures } from '../hooks/useCityTemperatures';
import { useSevereWeather } from '../hooks/useSevereWeather';

// Fix Leaflet's default icon
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// A component to center map from external state and report view changes
function MapController() {
  const map = useMap();
  const mapCenter = useWeatherStore(s => s.mapCenter);
  const mapZoom = useWeatherStore(s => s.mapZoom);
  const setMapCenter = useWeatherStore(s => s.setMapCenter);
  const setMapZoom = useWeatherStore(s => s.setMapZoom);

  // Sync state to map
  useEffect(() => {
    map.setView(mapCenter, mapZoom, { animate: true });
  }, [mapCenter, mapZoom, map]);

  // Sync map to state
  useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      // Only update if changed to prevent infinite loops
      // Not actually updating the store on moveend to avoid fighting the UI unless necessary
    },
    click: (e) => {
      const { lat, lng } = e.latlng;
      useWeatherStore.getState().setSelectedLocation({
        lat,
        lon: lng,
        name: `Lat: ${lat.toFixed(2)}, Lon: ${lng.toFixed(2)}`
      });
    }
  });

  return null;
}

const getTempColor = (temp: number) => {
  if (temp < 0) return 'hsl(230, 80%, 60%)'; // blue
  if (temp < 15) return 'hsl(160, 80%, 50%)'; // cyan
  if (temp < 25) return 'hsl(100, 70%, 45%)'; // green
  if (temp < 30) return 'hsl(40, 90%, 55%)';  // orange
  return 'hsl(0, 80%, 60%)';                  // red
};

const getCityIcon = (cityName: string): string => {
  const icons: { [key: string]: string } = {
    'Rome': '🏛️',
    'Milan': '🏙️',
    'Naples': '🏰',
    'Palermo': '🏝️',
    'Santa Teresa di Riva': '🏖️',
    'London': '🇬🇧',
    'Paris': '🇫🇷',
    'Berlin': '🇩🇪',
    'Madrid': '🇪🇸',
    'Moscow': '🇷🇺',
    'New York': '🗽',
    'Los Angeles': '🌴',
    'Chicago': '🌆',
    'Miami': '🏖️',
    'Tokyo': '🇯🇵',
    'Beijing': '🇨🇳',
    'Sydney': '🇦🇺',
    'Dubai': '🇦🇪',
    'Mumbai': '🇮🇳',
    'São Paulo': '🇧🇷',
    'Lagos': '🇳🇬',
    'Cairo': '🇪🇬',
    'Toronto': '🇨🇦',
    'Mexico City': '🇲🇽',
    'Buenos Aires': '🇦🇷',
    'Seoul': '🇰🇷',
    'Jakarta': '🇮🇩',
    'Bangkok': '🇹🇭',
    'Nairobi': '🇰🇪'
  };
  return icons[cityName] || '🌍';
};

export default function WeatherMap() {
  const { layers, radarOpacity, playbackState, selectedLocation } = useWeatherStore();
  const { data: rainData } = useRainViewer();
  const { data: cities } = useCityTemperatures();
  const { data: severeAlerts } = useSevereWeather();

  const activeRadarFrame = useMemo(() => {
    if (!rainData?.radar?.past) return null;
    const frames = rainData.radar.past;
    return frames[Math.min(playbackState.frameIndex, frames.length - 1)];
  }, [rainData, playbackState.frameIndex]);

  const activeSatFrame = useMemo(() => {
    if (!rainData?.satellite?.infrared) return null;
    const frames = rainData.satellite.infrared;
    return frames[Math.min(playbackState.frameIndex, frames.length - 1)] || frames[frames.length - 1];
  }, [rainData, playbackState.frameIndex]);

  return (
    <div className="absolute inset-0 h-[100dvh] w-full bg-background z-0">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        className="h-full w-full"
        zoomControl={false}
      >
        <MapController />
        
        {/* Base Layer */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="&copy; Esri"
          maxNativeZoom={19}
          maxZoom={25}
        />

        {/* RainViewer Clouds / Satellite */}
        {layers.satellite && activeSatFrame && (
          <TileLayer
            key={`sat-${activeSatFrame.path}`}
            url={`https://tilecache.rainviewer.com${activeSatFrame.path}/512/{z}/{x}/{y}/0/0_0.png`}
            opacity={radarOpacity / 100}
            zIndex={10}
          />
        )}

        {/* RainViewer Radar */}
        {layers.meteo && activeRadarFrame && (
          <TileLayer
            key={`radar-${activeRadarFrame.path}`}
            url={`https://tilecache.rainviewer.com${activeRadarFrame.path}/512/{z}/{x}/{y}/4/1_1.png`}
            opacity={radarOpacity / 100}
            zIndex={20}
          />
        )}

        {/* RainViewer Lightning (from nowcast/past data if available, using same path but colored differently or just base radar for now) */}
        {/* For true lightning, RainViewer doesn't give a separate layer easily in free tier, but we simulate the layer request */}
        {layers.lightning && activeRadarFrame && (
          <TileLayer
             key={`light-${activeRadarFrame.path}`}
             url={`https://tilecache.rainviewer.com${activeRadarFrame.path}/512/{z}/{x}/{y}/3/1_1.png`}
             opacity={radarOpacity / 100}
             zIndex={25}
          />
        )}

        {/* Selected Location Pin */}
        {selectedLocation && (
          <Marker position={[selectedLocation.lat, selectedLocation.lon]}>
            <Popup>
              <div className="font-mono text-sm space-y-1">
                <div className="font-bold text-primary mb-2">Punto selezionato</div>
                <div>Lat: {selectedLocation.lat.toFixed(4)}</div>
                <div>Lon: {selectedLocation.lon.toFixed(4)}</div>
                <div className="text-xs text-muted-foreground mt-2">
                  Dati meteo caricati nel pannello inferiore.
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Temperature Markers with City Icons */}
        {layers.temperature && cities && cities.map((city) => {
          const isMajorCity = ['Rome', 'Milan', 'Napoli', 'Palermo', 'Santa Teresa di Riva'].includes(city.name);
          const cityIcon = getCityIcon(city.name);
          
          return (
            <Marker
              key={city.name}
              position={[city.lat, city.lon]}
              icon={L.divIcon({
                className: 'leaflet-div-icon',
                html: `<div style="
                  position: relative;
                  width: ${isMajorCity ? 40 : 24}px;
                  height: ${isMajorCity ? 40 : 24}px;
                  background: ${getTempColor(city.temp)};
                  border-radius: 50%;
                  border: 2px solid white;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: ${isMajorCity ? '18px' : '12px'};
                  font-weight: bold;
                  color: white;
                  ${isMajorCity ? 'z-index: 100;' : ''}
                ">
                  ${cityIcon}
                  <div style="
                    position: absolute;
                    bottom: -4px;
                    right: -4px;
                    background: rgba(0,0,0,0.7);
                    color: white;
                    font-size: 8px;
                    font-weight: bold;
                    padding: 1px 3px;
                    border-radius: 4px;
                    white-space: nowrap;
                  ">
                    ${Math.round(city.temp)}°
                  </div>
                </div>`,
                iconSize: isMajorCity ? [40, 40] : [24, 24],
                iconAnchor: isMajorCity ? [20, 20] : [12, 12],
              })}
            >
              <Popup>
                <div className="font-mono text-sm">
                  <div className="font-bold text-primary mb-1">{city.name}</div>
                  <div>Temperatura: {Math.round(city.temp)}°C</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Lat: {city.lat.toFixed(2)}°, Lon: {city.lon.toFixed(2)}°
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Wind Animation Markers */}
        {layers.wind && cities && cities.map((city) => {
          const windSpeed = city.windSpeed || 0;
          const windDir = city.windDirection || 0;
          const windIconSize = Math.min(24, Math.max(12, windSpeed / 5));
          
          return (
            <Marker
              key={`wind-${city.name}`}
              position={[city.lat, city.lon]}
              icon={L.divIcon({
                className: 'leaflet-div-icon',
                html: `<div style="
                  width: ${windIconSize}px;
                  height: ${windIconSize}px;
                  position: relative;
                  animation: windSpin 2s linear infinite;
                ">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" 
                    style="transform: rotate(${windDir}deg); width: 100%; height: 100%;">
                    <path d="M5 12h14M12 5l7 7-7 7M12 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <style>
                  @keyframes windSpin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                  }
                </style>`,
                iconSize: [windIconSize, windIconSize],
                iconAnchor: [windIconSize / 2, windIconSize / 2],
              })}
            >
              <Popup>
                <div className="font-mono text-sm">
                  <div className="font-bold">{city.name}</div>
                  <div>Vento: {windSpeed} km/h</div>
                  <div>Direzione: {windDir}°</div>
                </div>
              </Popup>
            </Marker>
          );
        })}
          <Marker
            key={city.name}
            position={[city.lat, city.lon]}
            icon={L.divIcon({
              className: 'leaflet-div-icon',
              html: `<div class="temperature-badge" style="background: ${getTempColor(city.temp)}; width: ${city.name === 'Santa Teresa di Riva' ? 28 : 20}px; height: ${city.name === 'Santa Teresa di Riva' ? 28 : 20}px; ${city.name === 'Santa Teresa di Riva' ? 'box-shadow:0 0 8px rgba(255,255,255,.55); border:2px solid #fff;' : ''}; font-size: ${city.name === 'Santa Teresa di Riva' ? '10px' : '8px'}; font-weight: bold;">
                ${Math.round(city.temp)}°
              </div>`,
              iconSize: city.name === 'Santa Teresa di Riva' ? [28, 28] : [20, 20],
              iconAnchor: city.name === 'Santa Teresa di Riva' ? [14, 14] : [10, 10],
            })}
          >
            <Popup>
              <div className="font-mono text-sm font-bold">{city.name}: {Math.round(city.temp)}°C</div>
            </Popup>
          </Marker>
        ))}

        {/* Severe Weather Markers */}
        {layers.tornado && severeAlerts && severeAlerts.map((alert) => {
          if (!alert.lat || !alert.lon) return null;
          return (
            <Marker
              key={alert.id}
              position={[alert.lat, alert.lon]}
              icon={L.divIcon({
                className: 'leaflet-div-icon',
                html: `<div style="width: 20px; height: 20px; background: hsl(var(--destructive)); border-radius: 50%; opacity: 0.8; box-shadow: 0 0 10px hsl(var(--destructive)); border: 2px solid white; animation: pulse 2s infinite;"></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10],
              })}
            >
              <Popup>
                <div className="max-w-[250px] font-mono text-sm">
                  <div className="font-bold text-destructive mb-1">{alert.event}</div>
                  <div className="text-xs mb-2">{alert.areaDesc}</div>
                  <div className="line-clamp-3 text-xs opacity-90">{alert.headline}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* HUD Info */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex gap-4">
        <div className="bg-card/80 backdrop-blur-md border border-border px-4 py-1.5 rounded-full font-mono text-xs shadow-lg flex items-center gap-4 text-muted-foreground">
          <span>LAT <span className="text-foreground">{useWeatherStore.getState().mapCenter[0].toFixed(2)}</span></span>
          <span>LON <span className="text-foreground">{useWeatherStore.getState().mapCenter[1].toFixed(2)}</span></span>
          <span>ZOOM <span className="text-foreground">{useWeatherStore.getState().mapZoom}</span></span>
        </div>
      </div>
      
      {/* Zoom Controls */}
      <div className="absolute right-4 bottom-24 z-40 flex flex-col gap-2">
         <button 
           className="w-10 h-10 bg-card/90 backdrop-blur border border-border text-foreground rounded-md shadow-lg flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors font-mono text-xl"
           onClick={() => {
             const zoom = useWeatherStore.getState().mapZoom;
             useWeatherStore.getState().setMapZoom(zoom + 1);
           }}
         >
           +
         </button>
         <button 
           className="w-10 h-10 bg-card/90 backdrop-blur border border-border text-foreground rounded-md shadow-lg flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors font-mono text-xl"
           onClick={() => {
             const zoom = useWeatherStore.getState().mapZoom;
             useWeatherStore.getState().setMapZoom(Math.max(zoom - 1, 0));
           }}
         >
           -
         </button>
      </div>

    </div>
  );
}
