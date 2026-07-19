import { useQuery } from '@tanstack/react-query';
import { SevereAlert } from '../types/weather';
import { useWeatherStore } from '../store/useWeatherStore';

export function useSevereWeather() {
  const isEnabled = useWeatherStore((s) => s.layers.tornado);

  return useQuery({
    queryKey: ['severe-weather'],
    queryFn: async (): Promise<SevereAlert[]> => {
      const res = await fetch('https://api.weather.gov/alerts/active?status=actual&message_type=alert');
      if (!res.ok) throw new Error('Failed to fetch alerts');
      const data = await res.json();
      
      const severeTypes = ["Tornado", "Hurricane", "Tropical Storm", "Typhoon", "Cyclone", "Severe Thunderstorm"];
      
      const features: unknown[] = Array.isArray(data?.features) ? data.features : [];
      const alerts = features
        .filter((f): f is Record<string, any> => f !== null && typeof f === 'object')
        .filter((f) => {
          const event = f.properties?.event;
          return typeof event === 'string' && severeTypes.some(t => event.includes(t));
        })
        .map((f) => {
          let lat: number | undefined, lon: number | undefined;
          if (f.geometry?.type === 'Polygon' && Array.isArray(f.geometry.coordinates?.[0]?.[0])) {
            const coord = f.geometry.coordinates[0][0];
            if (typeof coord[0] === 'number' && typeof coord[1] === 'number') {
              lon = coord[0];
              lat = coord[1];
            }
          }
          const p = f.properties ?? {};
          return {
            id: typeof f.id === 'string' ? f.id : String(Math.random()),
            event: typeof p.event === 'string' ? p.event : 'Unknown Event',
            severity: typeof p.severity === 'string' ? p.severity : 'Unknown',
            headline: typeof p.headline === 'string' ? p.headline : '',
            description: typeof p.description === 'string' ? p.description : '',
            areaDesc: typeof p.areaDesc === 'string' ? p.areaDesc : '',
            onset: typeof p.onset === 'string' ? p.onset : new Date().toISOString(),
            lat,
            lon
          };
        });
        
      return alerts;
    },
    enabled: isEnabled,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    staleTime: 2 * 60 * 1000,
  });
}
