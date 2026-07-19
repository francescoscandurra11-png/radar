import { useQuery } from '@tanstack/react-query';
import { useWeatherStore } from '../store/useWeatherStore';

export const MAJOR_CITIES = [
  // Sicilia / Calabria
  { name: 'Santa Teresa di Riva', lat: 37.947, lon: 15.366 },
  { name: 'Messina', lat: 38.1938, lon: 15.554 },
  { name: 'Catania', lat: 37.5079, lon: 15.083 },
  { name: 'Palermo', lat: 38.1157, lon: 13.3615 },
  { name: 'Siracusa', lat: 37.0755, lon: 15.2866 },
  { name: 'Trapani', lat: 38.0176, lon: 12.5365 },
  { name: 'Reggio Calabria', lat: 38.1113, lon: 15.6471 },
  // Nord Italia
  { name: 'Milano', lat: 45.4642, lon: 9.19 },
  { name: 'Torino', lat: 45.0703, lon: 7.6869 },
  { name: 'Genova', lat: 44.4056, lon: 8.9463 },
  { name: 'Bologna', lat: 44.4949, lon: 11.3426 },
  { name: 'Venezia', lat: 45.4408, lon: 12.3155 },
  { name: 'Verona', lat: 45.4384, lon: 10.9916 },
  { name: 'Trieste', lat: 45.6495, lon: 13.7768 },
  { name: 'Bolzano', lat: 46.4983, lon: 11.3548 },
  { name: 'Brescia', lat: 45.5416, lon: 10.2118 },
  // Centro
  { name: 'Firenze', lat: 43.7696, lon: 11.2558 },
  { name: 'Roma', lat: 41.9028, lon: 12.4964 },
  { name: 'Perugia', lat: 43.1107, lon: 12.3908 },
  { name: 'Ancona', lat: 43.6158, lon: 13.5189 },
  { name: 'Pisa', lat: 43.7228, lon: 10.4017 },
  { name: 'Livorno', lat: 43.5485, lon: 10.3106 },
  // Sud / Isole
  { name: 'Napoli', lat: 40.8518, lon: 14.2681 },
  { name: 'Bari', lat: 41.1171, lon: 16.8719 },
  { name: 'Potenza', lat: 40.6418, lon: 15.8076 },
  { name: 'Lecce', lat: 40.3516, lon: 18.175 },
  { name: 'Cagliari', lat: 39.2238, lon: 9.1217 },
  { name: 'Sassari', lat: 40.7259, lon: 8.5557 },
  { name: 'Olbia', lat: 40.9234, lon: 9.5026 },
  // Vicino Italia
  { name: 'Zurigo', lat: 47.3769, lon: 8.5417 },
  { name: 'Ginevra', lat: 46.2044, lon: 6.1432 },
  { name: 'Berna', lat: 46.948, lon: 7.4474 },
  { name: 'Innsbruck', lat: 47.2692, lon: 11.4041 },
  { name: 'Graz', lat: 47.0707, lon: 15.4395 },
  { name: 'Lubiana', lat: 46.0569, lon: 14.5058 },
  { name: 'Zagabria', lat: 45.815, lon: 15.9819 },
  { name: 'Tunisi', lat: 36.8065, lon: 10.1815 },
  { name: 'Nizza', lat: 43.7102, lon: 7.262 },
  { name: 'Marsiglia', lat: 43.2965, lon: 5.3698 },
  // Mondo
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
  const batchSize = 8;
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
    queryKey: ['city-temperatures-v3'],
    queryFn: () => batchFetch(MAJOR_CITIES),
    enabled: isEnabled,
    refetchInterval: 15 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
  });
}
