import WeatherMap from '../components/WeatherMap';
import Sidebar from '../components/Sidebar';
import TimelineBar from '../components/TimelineBar';
import HourlyForecastPanel from '../components/HourlyForecastPanel';
import SevereWeatherPanel from '../components/SevereWeatherPanel';
import FlightsPanel from '../components/FlightsPanel';

export default function WeatherApp() {
  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-background">
      <WeatherMap />
      <Sidebar />
      <TimelineBar />
      
      {/* Overlay Panels */}
      <HourlyForecastPanel />
      <SevereWeatherPanel />
      <FlightsPanel />
      
      {/* Noise texture overlay for radar feel */}
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
    </div>
  );
}
