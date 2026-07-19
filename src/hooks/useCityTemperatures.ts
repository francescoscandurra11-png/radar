import { useQuery } from '@tanstack/react-query';
import { useWeatherStore } from '../store/useWeatherStore';

export const MAJOR_CITIES = [
  { name: 'Santa Teresa di Riva', lat: 37.947, lon: 15.366 },
  { name: 'Messina', lat: 38.1938, lon: 15.554 },
  { name: 'Catania', lat: 37.5079, lon: 15.083 },
  { name: 'Palermo', lat: 38.1157, lon: 13.3615 },
  { name: 'Milano', lat: 45.4642, lon: 9.19 },
  { name: 'Torino', lat: 45.0703, lon: 7.6869 },
  { name: 'Genova', lat: 44.4056, lon: 8.9463 },
  { name: 'Bologna', lat: 44.4949, lon: 11.3426 },
  { name: 'Firenze', lat: 43.7696, lon: 11.2558 },
  { name: 'Roma', lat: 41.9028, lon: 12.4964 },
  { name: 'Napoli', lat: 40.8518, lon: 14.2681 },
  { name: 'Bari', lat: 41.1171, lon: 16.8719 },
  { name: 'Cagliari', lat: 39.2238, lon: 9.1217 },
  { name: 'Venezia', lat: 45.4408, lon: 12.3155 },
  { name: 'Zurigo', lat: 47.3769, lon: 8.5417 },
  { name: 'Tunisi', lat: 36.8065, lon: 10.1815 },
  { name: 'London', lat: 51.5074, lon: -0.1278 },
  { name: 'Paris', lat: 48.8566, lon: 2.3522 },
  { name: 'Berlin', lat: 52.52, lon: 13.405 },
  { name: 'Madrid', lat: 40.4168, lon: -3.7038 },
  { name: 'New York', lat: 40.7128, lon: -74.006 },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
  { name: 'Dubai', lat: 25.2048, lon: 55.2708 },
  { name: 'Cairo', lat: 30.0444, lon: 31.2357 },
];

export interface CityTemperature {
  name: string;
  lat: number;
  lon: number;
  temp: number;
  tempMin: number;
  tempMax: number;
}

const batchFetch = async (cities: typeof MAJOR_CITIES): Promise<CityTemperature[]> => {
  const batchSize = 6;
  const results: CityTemperature[] = [];

  for (let i = 0; i < cities.length; i += batchSize) {
    const batch = cities.slice(i, i + batchSize);
    const settled = await Promise.all(
      batch.map(async (city) => {
        try {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=auto`
          );
          if (!res.ok) return null;
          const data = await res.json();
          const current = data.current?.temperature_2m ?? data.current_weather?.temperature;
          const tempMax = data.daily?.temperature_2m_max?.[0] ?? current;
          const tempMin = data.daily?.temperature_2m_min?.[0] ?? current;
          return {
            ...city,
            temp: current,
            tempMin,
            tempMax,
          } as CityTemperature;
        } catch {
          return null;
        }
      })
    );
    results.push(...(settled.filter(Boolean) as CityTemperature[]));
  }
  return results;
};

export function useCityTemperatures() {
  const isEnabled = useWeatherStore((s) => s.layers.temperature);

  return useQuery({
    queryKey: ['city-temperatures-v2'],
    queryFn: () => batchFetch(MAJOR_CITIES),
    enabled: isEnabled,
    refetchInterval: 15 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
  });
}
