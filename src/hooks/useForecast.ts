import { useQuery } from '@tanstack/react-query';
import { HourlyForecast } from '../types/weather';

export interface DailyForecast {
  time: string[];
  weathercode: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
  windspeed_10m_max: number[];
}

export interface ForecastBundle {
  hourly: HourlyForecast;
  daily: DailyForecast;
  timezone: string;
}

export function useForecast(lat?: number, lon?: number) {
  return useQuery({
    queryKey: ['forecast-v2', lat, lon],
    queryFn: async (): Promise<ForecastBundle> => {
      if (lat === undefined || lon === undefined) throw new Error('Lat/Lon required');
      const params = new URLSearchParams({
        latitude: String(lat),
        longitude: String(lon),
        hourly:
          'temperature_2m,precipitation,weathercode,windspeed_10m,relativehumidity_2m,apparent_temperature',
        daily:
          'weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max',
        forecast_days: '7',
        timezone: 'auto',
        wind_speed_unit: 'kmh',
      });
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
      if (!res.ok) throw new Error('Failed to fetch forecast');
      const data = await res.json();
      return {
        hourly: data.hourly,
        daily: data.daily,
        timezone: data.timezone ?? 'auto',
      };
    },
    enabled: lat !== undefined && lon !== undefined,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
