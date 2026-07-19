import { useCallback, useEffect, useRef } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';

export type FieldMode = 'temperature' | 'wind';

interface GridPoint {
  lat: number;
  lon: number;
  value: number;
  dir?: number;
}

function tempColor(t: number): [number, number, number, number] {
  // yellow → orange → red → magenta (come mappa termica)
  if (t < 5) return [59, 130, 246, 160];
  if (t < 12) return [34, 197, 94, 165];
  if (t < 18) return [163, 230, 53, 170];
  if (t < 24) return [250, 204, 21, 175];
  if (t < 28) return [249, 115, 22, 185];
  if (t < 32) return [239, 68, 68, 195];
  if (t < 36) return [220, 38, 38, 205];
  if (t < 40) return [219, 39, 119, 215];
  return [192, 38, 211, 225];
}

function windColor(kmh: number): [number, number, number, number] {
  // verde → giallo → arancio (come mappa vento)
  if (kmh < 8) return [34, 197, 94, 140];
  if (kmh < 15) return [74, 222, 128, 155];
  if (kmh < 25) return [163, 230, 53, 165];
  if (kmh < 35) return [250, 204, 21, 180];
  if (kmh < 50) return [249, 115, 22, 195];
  return [239, 68, 68, 210];
}

function lerpColor(
  a: [number, number, number, number],
  b: [number, number, number, number],
  t: number
): [number, number, number, number] {
  const u = Math.max(0, Math.min(1, t));
  return [
    a[0] + (b[0] - a[0]) * u,
    a[1] + (b[1] - a[1]) * u,
    a[2] + (b[2] - a[2]) * u,
    a[3] + (b[3] - a[3]) * u,
  ];
}

async function fetchGrid(
  lats: number[],
  lons: number[],
  mode: FieldMode,
  tempMode: 'min' | 'max'
): Promise<GridPoint[]> {
  const points: GridPoint[] = [];
  const chunk = 40;

  for (let i = 0; i < lats.length; i += chunk) {
    const la = lats.slice(i, i + chunk);
    const lo = lons.slice(i, i + chunk);
    const params =
      mode === 'temperature'
        ? `current=temperature_2m&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=auto`
        : `current=wind_speed_10m,wind_direction_10m&wind_speed_unit=kmh`;

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${la.join(',')}&longitude=${lo.join(',')}&${params}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      const rows = Array.isArray(data) ? data : [data];

      rows.forEach((row: any, idx: number) => {
        const lat = la[idx];
        const lon = lo[idx];
        if (mode === 'temperature') {
          const current = row.current?.temperature_2m ?? row.current_weather?.temperature;
          const max = row.daily?.temperature_2m_max?.[0] ?? current;
          const min = row.daily?.temperature_2m_min?.[0] ?? current;
          const value = tempMode === 'min' ? min : max;
          if (typeof value === 'number') points.push({ lat, lon, value });
        } else {
          const speed = row.current?.wind_speed_10m ?? 0;
          const dir = row.current?.wind_direction_10m ?? 0;
          points.push({ lat, lon, value: speed, dir });
        }
      });
    } catch {
      /* skip batch */
    }
  }
  return points;
}

function idw(lat: number, lon: number, pts: GridPoint[]): GridPoint | null {
  if (!pts.length) return null;
  let num = 0;
  let den = 0;
  let dirX = 0;
  let dirY = 0;
  let nearest = pts[0];
  let nearestD = Infinity;

  for (const p of pts) {
    const d2 = (p.lat - lat) ** 2 + (p.lon - lon) ** 2;
    if (d2 < nearestD) {
      nearestD = d2;
      nearest = p;
    }
    const w = 1 / Math.max(d2, 1e-6);
    num += p.value * w;
    den += w;
    if (p.dir != null) {
      const rad = (p.dir * Math.PI) / 180;
      dirX += Math.sin(rad) * w;
      dirY += Math.cos(rad) * w;
    }
  }
  const dir =
    den > 0 ? ((Math.atan2(dirX / den, dirY / den) * 180) / Math.PI + 360) % 360 : nearest.dir;
  return { lat, lon, value: num / den, dir };
}

interface Props {
  mode: FieldMode;
  opacity?: number;
  tempMode?: 'min' | 'max';
  onGrid?: (pts: GridPoint[]) => void;
}

export default function ColorFieldLayer({
  mode,
  opacity = 0.72,
  tempMode = 'max',
  onGrid,
}: Props) {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointsRef = useRef<GridPoint[]>([]);
  const abortRef = useRef(0);
  const particlesRef = useRef<{ x: number; y: number; life: number; age: number }[]>([]);
  const rafRef = useRef(0);

  const paintHeat = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const size = map.getSize();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size.x * dpr;
    canvas.height = size.y * dpr;
    canvas.style.width = `${size.x}px`;
    canvas.style.height = `${size.y}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.x, size.y);

    const pts = pointsRef.current;
    if (!pts.length) return;

    const step = Math.max(10, Math.floor(18 - map.getZoom()));
    const cell = step * 1.65;

    for (let y = 0; y < size.y; y += step) {
      for (let x = 0; x < size.x; x += step) {
        const ll = map.containerPointToLatLng([x + step / 2, y + step / 2]);
        const sample = idw(ll.lat, ll.lng, pts);
        if (!sample) continue;
        const rgba = mode === 'temperature' ? tempColor(sample.value) : windColor(sample.value);
        const [r, g, b, a] = rgba;
        ctx.fillStyle = `rgba(${r|0},${g|0},${b|0},${(a / 255) * opacity})`;
        ctx.beginPath();
        ctx.arc(x + step / 2, y + step / 2, cell, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [map, mode, opacity]);

  const loadGrid = useCallback(async () => {
    const token = ++abortRef.current;
    const bounds = map.getBounds().pad(0.08);
    const zoom = map.getZoom();
    const cols = zoom < 4 ? 5 : zoom < 6 ? 7 : zoom < 9 ? 9 : 11;
    const rows = cols;
    const west = bounds.getWest();
    const east = bounds.getEast();
    const south = bounds.getSouth();
    const north = bounds.getNorth();
    const lats: number[] = [];
    const lons: number[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const lat = south + ((north - south) * (r + 0.5)) / rows;
        const lon = west + ((east - west) * (c + 0.5)) / cols;
        lats.push(Number(lat.toFixed(3)));
        lons.push(Number(lon.toFixed(3)));
      }
    }

    const pts = await fetchGrid(lats, lons, mode, tempMode);
    if (token !== abortRef.current) return;
    pointsRef.current = pts;
    onGrid?.(pts);
    paintHeat();
  }, [map, mode, tempMode, onGrid, paintHeat]);

  useEffect(() => {
    const container = map.getContainer();
    const canvas = document.createElement('canvas');
    canvas.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:350;';
    container.appendChild(canvas);
    canvasRef.current = canvas;

    loadGrid();

    const onMove = () => {
      paintHeat();
    };
    const onSettle = () => {
      loadGrid();
    };

    map.on('move', onMove);
    map.on('zoom', onMove);
    map.on('moveend', onSettle);
    map.on('zoomend', onSettle);
    map.on('resize', onSettle);

    // wind particles over colored field
    const spawn = (n: number) => {
      const size = map.getSize();
      for (let i = 0; i < n; i++) {
        particlesRef.current.push({
          x: Math.random() * size.x,
          y: Math.random() * size.y,
          life: 35 + Math.random() * 55,
          age: 0,
        });
      }
    };
    spawn(180);

    const tick = () => {
      if (mode === 'wind' && pointsRef.current.length && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        const size = map.getSize();
        if (ctx) {
          // redraw heat then streaks
          paintHeat();
          ctx.save();
          ctx.globalAlpha = 0.75 * opacity;
          ctx.strokeStyle = 'rgba(255,255,255,0.85)';
          ctx.lineWidth = 1.15;
          ctx.lineCap = 'round';
          const next = [];
          for (const p of particlesRef.current) {
            const ll = map.containerPointToLatLng([p.x, p.y]);
            const s = idw(ll.lat, ll.lng, pointsRef.current);
            if (!s) continue;
            const rad = (((s.dir ?? 0) + 180) * Math.PI) / 180;
            const speed = Math.max(0.35, Math.min(s.value / 16, 3.4));
            const u = Math.sin(rad) * speed;
            const v = -Math.cos(rad) * speed;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + u, p.y + v);
            ctx.stroke();
            p.x += u;
            p.y += v;
            p.age += 1;
            if (
              p.age < p.life &&
              p.x > -30 &&
              p.y > -30 &&
              p.x < size.x + 30 &&
              p.y < size.y + 30
            ) {
              next.push(p);
            }
          }
          particlesRef.current = next;
          if (particlesRef.current.length < 160) spawn(40);
          ctx.restore();
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      map.off('move', onMove);
      map.off('zoom', onMove);
      map.off('moveend', onSettle);
      map.off('zoomend', onSettle);
      map.off('resize', onSettle);
      canvas.remove();
    };
  }, [map, mode, loadGrid, paintHeat, opacity]);

  useMapEvents({});
  return null;
}

export type { GridPoint };
