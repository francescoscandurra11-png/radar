import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useWeatherStore } from '../store/useWeatherStore';
import { useRainViewer } from '../hooks/useRainViewer';
import { useCityTemperatures } from '../hooks/useCityTemperatures';
import { useCityWinds } from '../hooks/useCityWinds';
import { useSevereWeather } from '../hooks/useSevereWeather';
import ColorFieldLayer, { windLabelColor, tempLabelColor } from './ColorFieldLayer';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

function MapController({ onView }: { onView: (lat: number, lon: number, zoom: number) => void }) {
  const map = useMap();
  const mapCenter = useWeatherStore((s) => s.mapCenter);
  const mapZoom = useWeatherStore((s) => s.mapZoom);

  useEffect(() => {
    map.setMaxZoom(22);
    map.setMinZoom(1);
    map.setView(mapCenter, mapZoom, { animate: true });
  }, [mapCenter, mapZoom, map]);

  useMapEvents({
    moveend: () => {
      const c = map.getCenter();
      onView(c.lat, c.lng, map.getZoom());
    },
    zoomend: () => {
      const c = map.getCenter();
      onView(c.lat, c.lng, map.getZoom());
    },
    click: (e) => {
      const { lat, lng } = e.latlng;
      useWeatherStore.getState().setSelectedLocation({
        lat,
        lon: lng,
        name: `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`,
      });
    },
  });

  return null;
}

export default function WeatherMap() {
  const { layers, radarOpacity, playbackState, selectedLocation, mapCenter, mapZoom } = useWeatherStore();
  const { data: rainData } = useRainViewer();
  const { data: cities } = useCityTemperatures();
  const { data: winds } = useCityWinds();
  const { data: severeAlerts } = useSevereWeather();
  const [tempMode, setTempMode] = useState<'min' | 'max'>('max');
  const [hud, setHud] = useState({ lat: mapCenter[0], lon: mapCenter[1], zoom: mapZoom });

  useEffect(() => {
    setHud({ lat: mapCenter[0], lon: mapCenter[1], zoom: mapZoom });
  }, [mapCenter, mapZoom]);

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
    <div className="absolute inset-0 h-[100dvh] w-full bg-[#05080f] z-0">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={1}
        maxZoom={22}
        className="h-full w-full"
        zoomControl={false}
        worldCopyJump
      >
        <MapController onView={(lat, lon, zoom) => setHud({ lat, lon, zoom })} />

        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="&copy; Esri"
          maxNativeZoom={19}
          maxZoom={22}
        />

        {layers.satellite && activeSatFrame && (
          <TileLayer
            key={`sat-${activeSatFrame.path}`}
            url={`https://tilecache.rainviewer.com${activeSatFrame.path}/512/{z}/{x}/{y}/0/0_0.png`}
            opacity={radarOpacity / 100}
            zIndex={10}
            maxZoom={22}
          />
        )}

        {(layers.meteo || layers.rain) && activeRadarFrame && (
          <TileLayer
            key={`radar-${activeRadarFrame.path}`}
            url={`https://tilecache.rainviewer.com${activeRadarFrame.path}/512/{z}/{x}/{y}/4/1_1.png`}
            opacity={radarOpacity / 100}
            zIndex={20}
            maxZoom={22}
          />
        )}

        {layers.lightning && activeRadarFrame && (
          <TileLayer
            key={`light-${activeRadarFrame.path}`}
            url={`https://tilecache.rainviewer.com${activeRadarFrame.path}/512/{z}/{x}/{y}/3/1_1.png`}
            opacity={radarOpacity / 100}
            zIndex={25}
            maxZoom={22}
          />
        )}

        {layers.temperature && (
          <ColorFieldLayer
            key={`temp-field-${tempMode}`}
            mode="temperature"
            tempMode={tempMode}
            opacity={0.82}
            seedCities={cities}
          />
        )}

        {layers.wind && (
          <ColorFieldLayer
            key="wind-field"
            mode="wind"
            opacity={0.85}
            seedCities={winds}
          />
        )}

        {selectedLocation && (
          <Marker position={[selectedLocation.lat, selectedLocation.lon]}>
            <Popup>
              <div className="font-mono text-sm space-y-1">
                <div className="font-bold text-cyan-400 mb-1">Punto selezionato</div>
                <div>{selectedLocation.name}</div>
                <div className="text-xs opacity-70">
                  {selectedLocation.lat.toFixed(4)}, {selectedLocation.lon.toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Temperature labels — stile mappa termica */}
        {layers.temperature &&
          cities &&
          cities.map((city) => (
            <Marker
              key={`t-${city.name}-${tempMode}`}
              position={[city.lat, city.lon]}
              icon={L.divIcon({
                className: 'leaflet-div-icon',
                html: `<div class="map-data-label">
                  <div class="map-data-value" style="color:${tempLabelColor(tempMode === 'min' ? city.tempMin : city.tempMax)}">${Math.round(tempMode === 'min' ? city.tempMin : city.tempMax)}</div>
                  <div class="map-data-name">${city.name === 'Santa Teresa di Riva' ? 'S. Teresa' : city.name}</div>
                </div>`,
                iconSize: [100, 44],
                iconAnchor: [50, 22],
              })}
            >
              <Popup>
                <div className="font-mono text-sm font-bold">
                  {city.name}: {Math.round(tempMode === 'min' ? city.tempMin : city.tempMax)}°C
                  <div className="text-xs opacity-70">
                    ora {Math.round(city.temp)}° · min {Math.round(city.tempMin)}° · max{' '}
                    {Math.round(city.tempMax)}°
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Wind speed labels — stile "14 km/h / Tunisi" */}
        {layers.wind &&
          winds &&
          winds.map((w) => (
            <Marker
              key={`w-${w.name}`}
              position={[w.lat, w.lon]}
              icon={L.divIcon({
                className: 'leaflet-div-icon',
                html: `<div class="map-data-label">
                  <div class="map-data-value" style="color:${windLabelColor(w.speed)}">${Math.round(w.speed)} km/h</div>
                  <div class="map-data-name">${w.name === 'Santa Teresa di Riva' ? 'S. Teresa' : w.name}</div>
                </div>`,
                iconSize: [110, 44],
                iconAnchor: [55, 22],
              })}
            >
              <Popup>
                <div className="font-mono text-sm">
                  <div className="font-bold">{w.name}</div>
                  <div>
                    Vento {Math.round(w.speed)} km/h · dir {Math.round(w.direction)}°
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {layers.tornado &&
          severeAlerts &&
          severeAlerts.map((alert) => {
            if (!alert.lat || !alert.lon) return null;
            return (
              <Marker
                key={alert.id}
                position={[alert.lat, alert.lon]}
                icon={L.divIcon({
                  className: 'leaflet-div-icon',
                  html: `<div class="severe-pulse"></div>`,
                  iconSize: [20, 20],
                  iconAnchor: [10, 10],
                })}
              >
                <Popup>
                  <div className="max-w-[250px] font-mono text-sm">
                    <div className="font-bold text-red-400 mb-1">{alert.event}</div>
                    <div className="text-xs mb-2">{alert.areaDesc}</div>
                    <div className="line-clamp-3 text-xs opacity-90">{alert.headline}</div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>

      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex gap-2 sm:gap-3">
        {[
          ['LAT', hud.lat.toFixed(2)],
          ['LON', hud.lon.toFixed(2)],
          ['ZOOM', String(hud.zoom)],
        ].map(([k, v]) => (
          <div
            key={k}
            className="bg-[#070b14]/80 backdrop-blur-md border border-cyan-400/20 px-3 py-1 rounded-lg font-mono text-[10px] sm:text-xs text-white/50 shadow-[0_0_20px_rgba(34,211,238,0.08)]"
          >
            {k} <span className="text-cyan-300">{v}</span>
          </div>
        ))}
      </div>

      {layers.temperature && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 flex gap-2">
          {(['min', 'max'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setTempMode(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider border transition-all duration-300 ${
                tempMode === m
                  ? 'bg-cyan-500/25 border-cyan-400/50 text-cyan-200'
                  : 'bg-[#070b14]/80 border-white/15 text-white/60 hover:border-cyan-400/30 hover:text-white'
              }`}
            >
              {m === 'min' ? 'Min (°C)' : 'Max (°C)'}
            </button>
          ))}
        </div>
      )}

      <div className="absolute right-3 bottom-24 z-40 flex flex-col gap-2">
        <button
          className="w-10 h-10 bg-[#070b14]/90 backdrop-blur border border-cyan-400/25 text-cyan-200 rounded-xl shadow-lg flex items-center justify-center hover:bg-cyan-500/20 hover:border-cyan-400/50 transition-all duration-300 font-mono text-xl"
          onClick={() => {
            const zoom = useWeatherStore.getState().mapZoom;
            useWeatherStore.getState().setMapZoom(Math.min(zoom + 1, 22));
          }}
        >
          +
        </button>
        <button
          className="w-10 h-10 bg-[#070b14]/90 backdrop-blur border border-cyan-400/25 text-cyan-200 rounded-xl shadow-lg flex items-center justify-center hover:bg-cyan-500/20 hover:border-cyan-400/50 transition-all duration-300 font-mono text-xl"
          onClick={() => {
            const zoom = useWeatherStore.getState().mapZoom;
            useWeatherStore.getState().setMapZoom(Math.max(zoom - 1, 1));
          }}
        >
          -
        </button>
      </div>
    </div>
  );
}
