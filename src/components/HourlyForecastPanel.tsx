import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Sun, Cloud, CloudRain, CloudSnow, Zap, CloudFog, Droplets } from 'lucide-react';
import { useWeatherStore } from '../store/useWeatherStore';
import { useForecast } from '../hooks/useForecast';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

const DEFAULT_LOC = { lat: 37.95, lon: 15.37, name: 'Santa Teresa di Riva' };

const getWeatherIcon = (code: number) => {
  if (code === 0) return <Sun className="w-5 h-5 text-yellow-400" />;
  if (code >= 1 && code <= 3) return <Cloud className="w-5 h-5 text-slate-300" />;
  if (code >= 45 && code <= 48) return <CloudFog className="w-5 h-5 text-slate-400" />;
  if (code >= 51 && code <= 67) return <CloudRain className="w-5 h-5 text-sky-400" />;
  if (code >= 71 && code <= 77) return <CloudSnow className="w-5 h-5 text-white" />;
  if (code >= 80 && code <= 82) return <CloudRain className="w-5 h-5 text-blue-400" />;
  if (code >= 95 && code <= 99) return <Zap className="w-5 h-5 text-yellow-400" />;
  return <Sun className="w-5 h-5 text-yellow-400" />;
};

export default function HourlyForecastPanel() {
  const { activePanel, setActivePanel, selectedLocation, mapCenter, mapZoom } = useWeatherStore();

  const useDefault = !selectedLocation && mapZoom <= 4;
  const targetLat = selectedLocation?.lat ?? (useDefault ? DEFAULT_LOC.lat : mapCenter[0]);
  const targetLon = selectedLocation?.lon ?? (useDefault ? DEFAULT_LOC.lon : mapCenter[1]);
  const targetName =
    selectedLocation?.name ?? (useDefault ? DEFAULT_LOC.name : `Mappa ${targetLat.toFixed(2)}°, ${targetLon.toFixed(2)}°`);

  const { data, isLoading, isError, refetch, isFetching } = useForecast(targetLat, targetLon);
  const forecast = data?.hourly;
  const isOpen = activePanel === 'forecast';

  const nowIndex = useMemo(() => {
    if (!forecast?.time?.length) return 0;
    const now = Date.now();
    let idx = 0;
    for (let i = 0; i < forecast.time.length; i++) {
      if (parseISO(forecast.time[i]).getTime() <= now) idx = i;
      else break;
    }
    return idx;
  }, [forecast]);

  const hours = useMemo(() => {
    if (!forecast?.time) return [];
    return forecast.time.slice(nowIndex, nowIndex + 48).map((timeStr, i) => {
      const abs = nowIndex + i;
      return {
        timeStr,
        date: parseISO(timeStr),
        temp: forecast.temperature_2m[abs],
        precip: forecast.precipitation[abs],
        wind: forecast.windspeed_10m[abs],
        humidity: forecast.relativehumidity_2m?.[abs],
        code: forecast.weathercode[abs],
      };
    });
  }, [forecast, nowIndex]);

  const chartData = hours.map((h) => ({ time: h.timeStr, temp: h.temp }));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 220 }}
          className="fixed bottom-[56px] left-0 md:left-[240px] right-0 h-[320px] sm:h-[340px] bg-[#070b14]/97 backdrop-blur-xl border-t border-cyan-400/20 z-30 shadow-[0_-12px_40px_rgba(0,0,0,0.55)] flex flex-col font-sans"
        >
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10">
            <div>
              <h3 className="font-bold text-white tracking-wide">Previsioni Orarie</h3>
              <p className="text-xs font-mono text-cyan-300/80 truncate max-w-[70vw]">{targetName}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => refetch()}
                className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-lg border border-white/15 text-white/60 hover:text-cyan-300 hover:border-cyan-400/40 transition-all duration-300"
              >
                {isFetching ? '...' : 'Aggiorna'}
              </button>
              <button
                onClick={() => setActivePanel(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-all duration-300 text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto overflow-y-hidden p-3 sm:p-4 flex gap-2.5 sm:gap-3">
            {isLoading && (
              <div className="text-cyan-300/70 font-mono m-auto text-sm animate-pulse">
                Caricamento previsioni...
              </div>
            )}
            {isError && (
              <div className="text-red-400 font-mono m-auto text-sm">
                Errore caricamento. Tocca Aggiorna.
              </div>
            )}

            {hours.map((h) => (
              <div
                key={h.timeStr}
                className="min-w-[78px] flex flex-col items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-cyan-500/10 hover:border-cyan-400/30 transition-all duration-300"
              >
                <span className="text-[11px] font-mono font-bold text-white/50">
                  {format(h.date, 'HH:mm')}
                </span>
                <span className="text-[9px] font-mono text-white/35 uppercase">
                  {format(h.date, 'EEE', { locale: it })}
                </span>
                <div className="my-1.5">{getWeatherIcon(h.code)}</div>
                <div className="text-lg font-bold text-white">{Math.round(h.temp)}°</div>
                <div className="flex flex-col items-center mt-1.5 gap-0.5 w-full">
                  {h.precip > 0 ? (
                    <span className="text-[10px] text-sky-400 font-mono flex items-center gap-0.5">
                      <Droplets className="w-3 h-3" />
                      {h.precip.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-[10px] text-white/30 font-mono">0 mm</span>
                  )}
                  <span className="text-[10px] text-white/45 font-mono">{Math.round(h.wind)} km/h</span>
                  {h.humidity != null && (
                    <span className="text-[9px] text-white/35 font-mono">U {h.humidity}%</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="h-14 w-full px-4 pb-2 pointer-events-none opacity-70">
            {chartData.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <YAxis domain={['dataMin - 2', 'dataMax + 2']} hide />
                  <Line
                    type="monotone"
                    dataKey="temp"
                    stroke="#22d3ee"
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
