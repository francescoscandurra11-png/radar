import { useQuery } from '@tanstack/react-query';
import { FlightState } from '../types/weather';
import { useWeatherStore } from '../store/useWeatherStore';

export function useFlights() {
  const isEnabled = useWeatherStore((s) => s.layers.flights);

  return useQuery({
    queryKey: ['opensky-flights'],
    queryFn: async (): Promise<FlightState[]> => {
      const res = await fetch('https://opensky-network.org/api/states/all');
      if (!res.ok) throw new Error('Failed to fetch flight data');
      const data = await res.json();
      
      const states: unknown[] = Array.isArray(data?.states) ? data.states : [];
      return states
        .filter((s): s is unknown[] => Array.isArray(s) && s.length >= 11)
        .filter((state) => typeof state[5] === 'number' && typeof state[6] === 'number')
        .map((state) => ({
          icao24: typeof state[0] === 'string' ? state[0] : String(state[0] ?? ''),
          callsign: (typeof state[1] === 'string' ? state[1] : 'UNKNOWN').trim() || 'UNKNOWN',
          originCountry: typeof state[2] === 'string' ? state[2] : 'Unknown',
          lon: state[5] as number,
          lat: state[6] as number,
          altitude: typeof state[7] === 'number' ? state[7] : 0,
          velocity: typeof state[9] === 'number' ? state[9] : 0,
          heading: typeof state[10] === 'number' ? state[10] : 0,
        }))
        .slice(0, 500); // Limit to 500 for performance
    },
    enabled: isEnabled,
    refetchInterval: 30 * 1000, // 30 seconds
    staleTime: 10 * 1000,
  });
}
