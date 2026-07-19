import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import type { CityWind } from '../hooks/useCityWinds';

type Particle = { x: number; y: number; age: number; life: number };

function nearestWind(lat: number, lon: number, winds: CityWind[]): CityWind | null {
  if (!winds.length) return null;
  let best = winds[0];
  let bestD = Infinity;
  for (const w of winds) {
    const d = (w.lat - lat) ** 2 + (w.lon - lon) ** 2;
    if (d < bestD) {
      bestD = d;
      best = w;
    }
  }
  return best;
}

/** Meteorological degrees → screen vector (u east, v south-positive in screen y down) */
function windVector(directionDeg: number, speed: number) {
  const rad = ((directionDeg + 180) * Math.PI) / 180; // from where it blows → toward
  const s = Math.max(0.4, Math.min(speed / 18, 3.2));
  return {
    u: Math.sin(rad) * s,
    v: -Math.cos(rad) * s,
  };
}

interface Props {
  winds: CityWind[];
  opacity?: number;
}

export default function WindParticles({ winds, opacity = 0.85 }: Props) {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const container = map.getContainer();
    const canvas = document.createElement('canvas');
    canvas.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:450;';
    container.appendChild(canvas);
    canvasRef.current = canvas;

    const resize = () => {
      const size = map.getSize();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = size.x * dpr;
      canvas.height = size.y * dpr;
      canvas.style.width = `${size.x}px`;
      canvas.style.height = `${size.y}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const spawn = (count: number) => {
      const size = map.getSize();
      for (let i = 0; i < count; i++) {
        particlesRef.current.push({
          x: Math.random() * size.x,
          y: Math.random() * size.y,
          age: 0,
          life: 40 + Math.random() * 70,
        });
      }
    };
    spawn(220);

    const step = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx || !winds.length) {
        rafRef.current = requestAnimationFrame(step);
        return;
      }
      const size = map.getSize();
      ctx.clearRect(0, 0, size.x, size.y);
      ctx.globalAlpha = opacity;
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 1.1;
      ctx.lineCap = 'round';

      const next: Particle[] = [];
      for (const p of particlesRef.current) {
        const latlng = map.containerPointToLatLng([p.x, p.y]);
        const w = nearestWind(latlng.lat, latlng.lng, winds);
        if (!w) continue;
        const { u, v } = windVector(w.direction, w.speed);
        const x2 = p.x + u;
        const y2 = p.y + v;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        p.x = x2;
        p.y = y2;
        p.age += 1;

        if (
          p.age < p.life &&
          p.x >= -20 &&
          p.y >= -20 &&
          p.x <= size.x + 20 &&
          p.y <= size.y + 20
        ) {
          next.push(p);
        }
      }
      particlesRef.current = next;
      if (particlesRef.current.length < 200) spawn(30);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);

    map.on('resize zoom move', resize);
    return () => {
      cancelAnimationFrame(rafRef.current);
      map.off('resize zoom move', resize);
      canvas.remove();
    };
  }, [map, winds, opacity]);

  return null;
}
