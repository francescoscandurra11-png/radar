import { useQuery } from '@tanstack/react-query';
import { RainViewerData } from '../types/weather';

export function useRainViewer() {
  return useQuery({
    queryKey: ['rainviewer'],
    queryFn: async (): Promise<RainViewerData> => {
      const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
      if (!res.ok) throw new Error('Failed to fetch RainViewer data');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000,
  });
}
