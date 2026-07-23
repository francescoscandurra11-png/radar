import { useQuery } from '@tanstack/react-query';
import { HourlyForecast } from '../types/weather';

export function useForecast(lat?: number, lon?: number) {
  return useQuery({
    queryKey: ['forecast', lat, lon],
    queryFn: async (): Promise<HourlyForecast> => {
      if (lat === undefined || lon === undefined) throw new Error('Lat/Lon required');
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,weathercode,windspeed_10m,relativehumidity_2m&forecast_days=7&timezone=auto`
      );
      if (!res.ok) throw new Error('Failed to fetch forecast');
      const data = await res.json();
      return data.hourly;
    },
    enabled: lat !== undefined && lon !== undefined,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}
