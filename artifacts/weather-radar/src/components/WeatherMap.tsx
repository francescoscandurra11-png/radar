import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { CloudRain, Wind, Thermometer } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

import { useWeatherStore } from '../store/useWeatherStore';
import { useRainViewer } from '../hooks/useRainViewer';
import { useFlights } from '../hooks/useFlights';
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

export default function WeatherMap() {
  const { layers, radarOpacity, playbackState, selectedLocation } = useWeatherStore();
  const { data: rainData } = useRainViewer();
  const { data: flights } = useFlights();
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

  // Create custom flight icons dynamically
  const createFlightIcon = (heading: number) => {
    return L.divIcon({
      className: 'leaflet-div-icon',
      html: `<div style="transform: rotate(${heading}deg); color: hsl(200 90% 55%); font-size: 16px; text-shadow: 0 0 3px #000;">✈</div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  };

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
          maxZoom={18}
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

        {/* Flight Markers */}
        {layers.flights && flights && flights.map((flight) => (
          <Marker
            key={flight.icao24}
            position={[flight.lat, flight.lon]}
            icon={createFlightIcon(flight.heading)}
          >
            <Popup>
              <div className="font-mono text-sm space-y-1">
                <div className="font-bold text-primary mb-2">Volo {flight.callsign}</div>
                <div>Origine: {flight.originCountry}</div>
                <div>Altitudine: {flight.altitude} m</div>
                <div>Velocità: {flight.velocity} m/s</div>
                <div>Prua: {flight.heading}°</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Temperature Markers */}
        {layers.temperature && cities && cities.map((city) => (
          <Marker
            key={city.name}
            position={[city.lat, city.lon]}
            icon={L.divIcon({
              className: 'leaflet-div-icon',
              html: `<div class="temperature-badge" style="background: ${getTempColor(city.temp)}; width: 32px; height: 32px;">
                ${Math.round(city.temp)}°
              </div>`,
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            })}
          >
            <Popup>
              <div className="font-mono text-sm font-bold">{city.name}: {city.temp}°C</div>
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
             useWeatherStore.getState().setMapZoom(Math.min(zoom + 1, 18));
           }}
         >
           +
         </button>
         <button 
           className="w-10 h-10 bg-card/90 backdrop-blur border border-border text-foreground rounded-md shadow-lg flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors font-mono text-xl"
           onClick={() => {
             const zoom = useWeatherStore.getState().mapZoom;
             useWeatherStore.getState().setMapZoom(Math.max(zoom - 1, 2));
           }}
         >
           -
         </button>
      </div>

    </div>
  );
}
