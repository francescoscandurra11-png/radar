import { AnimatePresence, motion } from 'framer-motion';
import { X, Sun, Cloud, CloudRain, CloudSnow, Zap, CloudFog, CloudLightning } from 'lucide-react';
import { useWeatherStore } from '../store/useWeatherStore';
import { useForecast } from '../hooks/useForecast';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { format } from 'date-fns';

const getWeatherIcon = (code: number) => {
  if (code === 0) return <Sun className="w-5 h-5 text-yellow-400" />;
  if (code >= 1 && code <= 3) return <Cloud className="w-5 h-5 text-gray-400" />;
  if (code >= 45 && code <= 48) return <CloudFog className="w-5 h-5 text-gray-400" />;
  if (code >= 51 && code <= 67) return <CloudRain className="w-5 h-5 text-blue-400" />;
  if (code >= 71 && code <= 77) return <CloudSnow className="w-5 h-5 text-white" />;
  if (code >= 80 && code <= 82) return <CloudRain className="w-5 h-5 text-blue-500" />;
  if (code >= 95 && code <= 99) return <Zap className="w-5 h-5 text-yellow-500" />;
  return <Sun className="w-5 h-5 text-yellow-400" />;
};

export default function HourlyForecastPanel() {
  const { activePanel, setActivePanel, selectedLocation, mapCenter } = useWeatherStore();
  
  // Use selected location, or fallback to center of the map
  const targetLat = selectedLocation ? selectedLocation.lat : mapCenter[0];
  const targetLon = selectedLocation ? selectedLocation.lon : mapCenter[1];
  const targetName = selectedLocation ? selectedLocation.name : `Lat: ${targetLat.toFixed(2)}, Lon: ${targetLon.toFixed(2)}`;

  const { data: forecast, isLoading } = useForecast(targetLat, targetLon);

  const isOpen = activePanel === 'forecast';

  // Prepare chart data (next 48h)
  const chartData = forecast ? forecast.time.slice(0, 48).map((t, i) => ({
    time: t,
    temp: forecast.temperature_2m[i]
  })) : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-[60px] left-[240px] right-0 h-[320px] bg-card/95 backdrop-blur-xl border-t border-border z-30 shadow-2xl flex flex-col font-sans"
        >
          <div className="flex items-center justify-between px-6 py-3 border-b border-border/50">
            <div>
              <h3 className="font-bold text-foreground">Previsioni Orarie</h3>
              <p className="text-xs font-mono text-muted-foreground">{targetName}</p>
            </div>
            <button 
              onClick={() => setActivePanel(null)}
              className="p-2 hover:bg-accent/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 flex gap-4 scrollbar-hide">
            {isLoading && <div className="text-muted-foreground font-mono m-auto">Caricamento previsioni...</div>}
            
            {forecast && forecast.time.slice(0, 48).map((timeStr, i) => {
              const date = new Date(timeStr);
              const temp = forecast.temperature_2m[i];
              const precip = forecast.precipitation[i];
              const wind = forecast.windspeed_10m[i];
              const code = forecast.weathercode[i];

              return (
                <div key={timeStr} className="min-w-[80px] flex flex-col items-center justify-between bg-sidebar-accent/30 border border-border/50 rounded-lg p-3 hover:bg-sidebar-accent transition-colors">
                  <span className="text-xs font-mono font-bold text-muted-foreground">
                    {format(date, 'HH:mm')}
                  </span>
                  
                  <div className="my-2">
                    {getWeatherIcon(code)}
                  </div>
                  
                  <div className="text-lg font-bold">
                    {Math.round(temp)}°
                  </div>
                  
                  <div className="flex flex-col items-center mt-2 gap-1 w-full">
                    {precip > 0 ? (
                      <span className="text-[10px] text-blue-400 font-mono bg-blue-900/20 px-1.5 rounded">{precip}mm</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground font-mono">-</span>
                    )}
                    <span className="text-[10px] text-gray-400 font-mono">{Math.round(wind)}km/h</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mini Chart */}
          <div className="h-16 w-full px-6 pb-2 pointer-events-none opacity-60">
            {chartData.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <YAxis domain={['dataMin - 2', 'dataMax + 2']} hide />
                  <Line 
                    type="monotone" 
                    dataKey="temp" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2} 
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
