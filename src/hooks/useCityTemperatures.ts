import { useQuery } from '@tanstack/react-query';
import { useWeatherStore } from '../store/useWeatherStore';

export const MAJOR_CITIES = [
  // Sicilia / Italia (priorità)
  { name: 'Santa Teresa di Riva', lat: 37.947, lon: 15.366 },
  { name: 'Messina', lat: 38.1938, lon: 15.554 },
  { name: 'Catania', lat: 37.5079, lon: 15.083 },
  { name: 'Palermo', lat: 38.1157, lon: 13.3615 },
  { name: 'Milano', lat: 45.4642, lon: 9.19 },
  { name: 'Napoli', lat: 40.8518, lon: 14.2681 },
  { name: 'Rome', lat: 41.9028, lon: 12.4964 },
  // Mondo
  { name: 'London', lat: 51.5074, lon: -0.1278 },
  { name: 'Paris', lat: 48.8566, lon: 2.3522 },
  { name: 'Berlin', lat: 52.5200, lon: 13.4050 },
  { name: 'Madrid', lat: 40.4168, lon: -3.7038 },
  { name: 'Moscow', lat: 55.7558, lon: 37.6173 },
  { name: 'New York', lat: 40.7128, lon: -74.0060 },
  { name: 'Los Angeles', lat: 34.0522, lon: -118.2437 },
  { name: 'Chicago', lat: 41.8781, lon: -87.6298 },
  { name: 'Miami', lat: 25.7617, lon: -80.1918 },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
  { name: 'Beijing', lat: 39.9042, lon: 116.4074 },
  { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
  { name: 'Dubai', lat: 25.2048, lon: 55.2708 },
  { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
  { name: 'São Paulo', lat: -23.5505, lon: -46.6333 },
  { name: 'Lagos', lat: 6.5244, lon: 3.3792 },
  { name: 'Cairo', lat: 30.0444, lon: 31.2357 },
  { name: 'Toronto', lat: 43.6532, lon: -79.3832 },
  { name: 'Mexico City', lat: 19.4326, lon: -99.1332 },
  { name: 'Buenos Aires', lat: -34.6037, lon: -58.3816 },
  { name: 'Seoul', lat: 37.5665, lon: 126.9780 },
  { name: 'Jakarta', lat: -6.2088, lon: 106.8456 },
  { name: 'Bangkok', lat: 13.7563, lon: 100.5018 },
  { name: 'Nairobi', lat: -1.2921, lon: 36.8219 },
];

export interface CityTemperature {
  name: string;
  lat: number;
  lon: number;
  temp: number;
}

const batchFetch = async (cities: typeof MAJOR_CITIES): Promise<CityTemperature[]> => {
  // To avoid rate limiting, fetch in batches
  const batchSize = 5;
  const results: CityTemperature[] = [];
  
  for (let i = 0; i < cities.length; i += batchSize) {
    const batch = cities.slice(i, i + batchSize);
    const promises = batch.map(async (city) => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current_weather=true`);
        if (!res.ok) return null;
        const data = await res.json();
        return {
          ...city,
          temp: data.current_weather.temperature
        };
      } catch (e) {
        return null;
      }
    });
    const batchResults = await Promise.all(promises);
    results.push(...batchResults.filter(Boolean) as CityTemperature[]);
    
    // Slight delay between batches
    if (i + batchSize < cities.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  return results;
};

export function useCityTemperatures() {
  const isEnabled = useWeatherStore((s) => s.layers.temperature);

  return useQuery({
    queryKey: ['city-temperatures'],
    queryFn: () => batchFetch(MAJOR_CITIES),
    enabled: isEnabled,
    refetchInterval: 15 * 60 * 1000, // 15 mins
    staleTime: 5 * 60 * 1000,
  });
}
