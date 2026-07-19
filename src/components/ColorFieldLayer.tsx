import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { MAJOR_CITIES } from '../hooks/useCityTemperatures';
import type { CityWind } from '../hooks/useCityWinds';
import type { CityTemperature } from '../hooks/useCityTemperatures';

export type FieldMode = 'temperature' | 'wind';

interface GridPoint {
  lat: number;
  lon: number;
  value: number;
  dir?: number;
}

export function tempRgb(t: number): [number, number, number] {
  if (t < 8) return [56, 189, 248];
  if (t < 16) return [74, 222, 128];
  if (t < 22) return [250, 204, 21];
  if (t < 28) return [251, 146, 60];
  if (t < 33) return [239, 68, 68];
  if (t < 38) return [225, 29, 72];
  return [217, 70, 239];
}

export function windRgb(kmh: number): [number, number, number] {
  if (kmh < 8) return [22, 163, 74];
  if (kmh < 15) return [74, 222, 128];
  if (kmh < 22) return [163, 230, 53];
  if (kmh < 30) return [250, 204, 21];
  if (kmh < 40) return [249, 115, 22];
  return [239, 68, 68];
}

export function windLabelColor(kmh: number): string {
  const [r, g, b] = windRgb(kmh);
  return `rgb(${r},${g},${b})`;
}

export function tempLabelColor(t: number): string {
  const [r, g, b] = tempRgb(t);
  return `rgb(${r},${g},${b})`;
}

function idw(lat: number, lon: number, pts: GridPoint[]): GridPoint | null {
  if (!pts.length) return null;
  let num = 0;
  let den = 0;
  let dirX = 0;
  let dirY = 0;
  for (const p of pts) {
    const d2 = (p.lat - lat) ** 2 + ((p.lon - lon) * Math.cos((lat * Math.PI) / 180)) ** 2;
    const w = 1 / Math.max(d2, 1e-5);
    num += p.value * w;
    den += w;
    if (p.dir != null) {
      const rad = (p.dir * Math.PI) / 180;
      dirX += Math.sin(rad) * w;
      dirY += Math.cos(rad) * w;
    }
  }
  return {
    lat,
    lon,
    value: num / den,
    dir: den > 0 ? ((Math.atan2(dirX / den, dirY / den) * 180) / Math.PI + 360) % 360 : 0,
  };
}

async function fetchPoint(
  lat: number,
  lon: number,
  mode: FieldMode,
  tempMode: 'min' | 'max'
): Promise<GridPoint | null> {
  try {
    const q =
      mode === 'temperature'
        ? `current=temperature_2m&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=auto`
        : `current=wind_speed_10m,wind_direction_10m&wind_speed_unit=kmh`;
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&${q}`
    );
    if (!res.ok) return null;
    const row = await res.json();
    if (mode === 'temperature') {
      const cur = row.current?.temperature_2m;
      const max = row.daily?.temperature_2m_max?.[0] ?? cur;
      const min = row.daily?.temperature_2m_min?.[0] ?? cur;
      const value = tempMode === 'min' ? min : max;
      return typeof value === 'number' ? { lat, lon, value } : null;
    }
    return {
      lat,
      lon,
      value: Number(row.current?.wind_speed_10m ?? 0),
      dir: Number(row.current?.wind_direction_10m ?? 0),
    };
  } catch {
    return null;
  }
}

function citiesToPoints(
  seedCities: Array<CityWind | CityTemperature> | undefined,
  tempMode: 'min' | 'max'
): GridPoint[] {
  if (!seedCities?.length) return [];
  const out: GridPoint[] = [];
  for (const c of seedCities) {
    if ('speed' in c && typeof c.speed === 'number') {
      out.push({ lat: c.lat, lon: c.lon, value: c.speed, dir: c.direction });
    } else if ('temp' in c) {
      out.push({
        lat: c.lat,
        lon: c.lon,
        value: tempMode === 'min' ? c.tempMin : c.tempMax,
      });
    }
  }
  return out;
}

interface Props {
  mode: FieldMode;
  opacity?: number;
  tempMode?: 'min' | 'max';
  seedCities?: Array<CityWind | CityTemperature>;
}

export default function ColorFieldLayer({
  mode,
  opacity = 0.85,
  tempMode = 'max',
  seedCities,
}: Props) {
  const map = useMap();
  const pointsRef = useRef<GridPoint[]>([]);
  const drawRef = useRef<(() => void) | null>(null);

  // Update seed points when city data arrives (without remounting canvas)
  useEffect(() => {
    const seeded = citiesToPoints(seedCities, tempMode);
    if (seeded.length) {
      pointsRef.current = seeded;
      drawRef.current?.();
    }
  }, [seedCities, tempMode]);

  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    const particles: { x: number; y: number; age: number; life: number }[] = [];

    const canvas = document.createElement('canvas');
    canvas.className = 'color-field-canvas';
    canvas.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none;z-index:450;';

    const pane = map.getPanes().overlayPane;
    pane.appendChild(canvas);

    function redrawHeat() {
      if (cancelled) return;
      const pts = pointsRef.current;
      if (!pts.length) return;

      const size = map.getSize();
      const topLeft = map.containerPointToLayerPoint([0, 0]);
      L.DomUtil.setPosition(canvas, topLeft);

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(size.x * dpr));
      canvas.height = Math.max(1, Math.floor(size.y * dpr));
      canvas.style.width = `${size.x}px`;
      canvas.style.height = `${size.y}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size.x, size.y);

      const zoom = map.getZoom();
      const step = Math.max(7, Math.floor(20 - zoom * 1.15));
      const radius = step * 2.1;

      for (let y = 0; y < size.y + step; y += step) {
        for (let x = 0; x < size.x + step; x += step) {
          const ll = map.containerPointToLatLng([x, y]);
          const s = idw(ll.lat, ll.lng, pts);
          if (!s) continue;
          const [r, g, b] = mode === 'temperature' ? tempRgb(s.value) : windRgb(s.value);
          const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
          grad.addColorStop(0, `rgba(${r},${g},${b},${opacity})`);
          grad.addColorStop(0.5, `rgba(${r},${g},${b},${opacity * 0.5})`);
          grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    drawRef.current = redrawHeat;

    async function loadDense() {
      const bounds = map.getBounds().pad(0.1);
      const zoom = map.getZoom();
      const n = zoom < 4 ? 5 : zoom < 6 ? 7 : zoom < 9 ? 9 : 10;
      const west = bounds.getWest();
      const east = bounds.getEast();
      const south = bounds.getSouth();
      const north = bounds.getNorth();

      const jobs: Promise<GridPoint | null>[] = [];
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          const lat = south + ((north - south) * (r + 0.5)) / n;
          const lon = west + ((east - west) * (c + 0.5)) / n;
          jobs.push(fetchPoint(lat, lon, mode, tempMode));
        }
      }
      for (const city of MAJOR_CITIES) {
        if (bounds.contains(L.latLng(city.lat, city.lon))) {
          jobs.push(fetchPoint(city.lat, city.lon, mode, tempMode));
        }
      }

      const collected = pointsRef.current.slice();
      for (let i = 0; i < jobs.length; i += 10) {
        if (cancelled) return;
        const batch = await Promise.all(jobs.slice(i, i + 10));
        for (const p of batch) if (p) collected.push(p);
        pointsRef.current = collected;
        redrawHeat();
      }
    }

    function spawn(n: number) {
      const size = map.getSize();
      for (let i = 0; i < n; i++) {
        particles.push({
          x: Math.random() * size.x,
          y: Math.random() * size.y,
          age: 0,
          life: 28 + Math.random() * 55,
        });
      }
    }
    if (mode === 'wind') spawn(220);

    const onMove = () => redrawHeat();
    const onSettle = () => {
      loadDense();
    };

    map.on('move', onMove);
    map.on('zoom', onMove);
    map.on('moveend', onSettle);
    map.on('zoomend', onSettle);
    map.on('resize', onMove);

    // initial seed from props if already available
    const seeded = citiesToPoints(seedCities, tempMode);
    if (seeded.length) {
      pointsRef.current = seeded;
      redrawHeat();
    }

    loadDense();

    const tick = () => {
      if (cancelled) return;
      if (mode === 'wind' && pointsRef.current.length) {
        redrawHeat();
        const ctx = canvas.getContext('2d');
        const size = map.getSize();
        if (ctx) {
          ctx.save();
          ctx.lineCap = 'round';
          ctx.lineWidth = 1.5;
          const next: typeof particles = [];
          for (const p of particles) {
            const ll = map.containerPointToLatLng([p.x, p.y]);
            const s = idw(ll.lat, ll.lng, pointsRef.current);
            if (!s) continue;
            const [r, g, b] = windRgb(s.value);
            ctx.strokeStyle = `rgba(${Math.min(255, r + 90)},${Math.min(255, g + 90)},${Math.min(255, b + 40)},0.95)`;
            const rad = (((s.dir ?? 0) + 180) * Math.PI) / 180;
            const spd = Math.max(0.55, Math.min(s.value / 12, 4.2));
            const u = Math.sin(rad) * spd;
            const v = -Math.cos(rad) * spd;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + u * 2.4, p.y + v * 2.4);
            ctx.stroke();
            p.x += u;
            p.y += v;
            p.age += 1;
            if (p.age < p.life && p.x > -40 && p.y > -40 && p.x < size.x + 40 && p.y < size.y + 40) {
              next.push(p);
            }
          }
          particles.length = 0;
          particles.push(...next);
          if (particles.length < 180) spawn(55);
          ctx.restore();
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      map.off('move', onMove);
      map.off('zoom', onMove);
      map.off('moveend', onSettle);
      map.off('zoomend', onSettle);
      map.off('resize', onMove);
      canvas.remove();
      drawRef.current = null;
    };
    // seedCities handled by separate effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, mode, opacity, tempMode]);

  return null;
}
