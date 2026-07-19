import { useQuery } from '@tanstack/react-query';
import { useWeatherStore } from '../store/useWeatherStore';
import { MAJOR_CITIES } from './useCityTemperatures';

export interface CityWind {
  name: string;
  lat: number;
  lon: number;
  speed: number; // km/h
  direction: number; // degrees meteorological
}

async function fetchWinds(): Promise<CityWind[]> {
  const results: CityWind[] = [];
  const batchSize = 6;

  for (let i = 0; i < MAJOR_CITIES.length; i += batchSize) {
    const batch = MAJOR_CITIES.slice(i, i + batchSize);
    const settled = await Promise.all(
      batch.map(async (city) => {
        try {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=kmh`
          );
          if (!res.ok) return null;
          const data = await res.json();
          return {
            ...city,
            speed: data.current?.wind_speed_10m ?? 0,
            direction: data.current?.wind_direction_10m ?? 0,
          } as CityWind;
        } catch {
          return null;
        }
      })
    );
    results.push(...(settled.filter(Boolean) as CityWind[]));
  }
  return results;
}

export function useCityWinds() {
  const enabled = useWeatherStore((s) => s.layers.wind);

  return useQuery({
    queryKey: ['city-winds'],
    queryFn: fetchWinds,
    enabled,
    refetchInterval: 10 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
  });
}
