import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Sun, Cloud, CloudRain, CloudSnow, Zap, CloudFog, CalendarDays, Droplets, Wind } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { useWeatherStore } from '../store/useWeatherStore';
import { useForecast } from '../hooks/useForecast';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';

const DEFAULT_LOC = { lat: 37.95, lon: 15.37, name: 'Santa Teresa di Riva' };

const getWeatherIcon = (code: number, size = 'w-6 h-6') => {
  if (code === 0) return <Sun className={`${size} text-yellow-400`} />;
  if (code >= 1 && code <= 3) return <Cloud className={`${size} text-slate-300`} />;
  if (code >= 45 && code <= 48) return <CloudFog className={`${size} text-slate-400`} />;
  if (code >= 51 && code <= 67) return <CloudRain className={`${size} text-sky-400`} />;
  if (code >= 71 && code <= 77) return <CloudSnow className={`${size} text-sky-200`} />;
  if (code >= 80 && code <= 82) return <CloudRain className={`${size} text-blue-400`} />;
  if (code >= 95 && code <= 99) return <Zap className={`${size} text-yellow-400`} />;
  return <Sun className={`${size} text-yellow-400`} />;
};

const getWeatherLabel = (code: number): string => {
  if (code === 0) return 'Sereno';
  if (code >= 1 && code <= 2) return 'Parzialmente nuvoloso';
  if (code === 3) return 'Coperto';
  if (code >= 45 && code <= 48) return 'Nebbia';
  if (code >= 51 && code <= 55) return 'Pioggerella';
  if (code >= 61 && code <= 65) return 'Pioggia';
  if (code >= 71 && code <= 75) return 'Neve';
  if (code >= 80 && code <= 82) return 'Rovesci';
  if (code === 95) return 'Temporale';
  if (code >= 96 && code <= 99) return 'Temporale con grandine';
  return 'Variabile';
};

const getTempGradient = (min: number, max: number) => {
  const toColor = (t: number) => {
    if (t < 0) return '#3b82f6';
    if (t < 10) return '#06b6d4';
    if (t < 20) return '#22c55e';
    if (t < 28) return '#f97316';
    return '#ef4444';
  };
  return `linear-gradient(to right, ${toColor(min)}, ${toColor(max)})`;
};

export default function WeeklyForecastPanel() {
  const { activePanel, setActivePanel, selectedLocation, mapCenter, mapZoom } = useWeatherStore();

  const useDefault = !selectedLocation && mapZoom <= 4;
  const targetLat = selectedLocation?.lat ?? (useDefault ? DEFAULT_LOC.lat : mapCenter[0]);
  const targetLon = selectedLocation?.lon ?? (useDefault ? DEFAULT_LOC.lon : mapCenter[1]);
  const targetName =
    selectedLocation?.name ?? (useDefault ? DEFAULT_LOC.name : `${targetLat.toFixed(2)}°, ${targetLon.toFixed(2)}°`);

  const { data, isLoading, isError, refetch, isFetching } = useForecast(targetLat, targetLon);
  const isOpen = activePanel === 'weekly';

  const days = useMemo(() => {
    const daily = data?.daily;
    if (!daily?.time?.length) return [];
    return daily.time.map((dateStr, i) => ({
      date: parseISO(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`),
      dateStr: dateStr.slice(0, 10),
      minTemp: Math.round(daily.temperature_2m_min[i]),
      maxTemp: Math.round(daily.temperature_2m_max[i]),
      totalPrecip: Number((daily.precipitation_sum[i] ?? 0).toFixed(1)),
      maxWind: Math.round(daily.windspeed_10m_max[i] ?? 0),
      dominantCode: daily.weathercode[i] ?? 0,
    }));
  }, [data]);

  const chartData = days.map((d) => ({ date: d.dateStr, max: d.maxTemp, min: d.minTemp }));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          className="fixed bottom-[56px] left-0 right-0 md:left-[240px] bg-[#070b14]/97 backdrop-blur-xl border-t border-cyan-400/20 z-30 shadow-[0_-12px_40px_rgba(0,0,0,0.55)] flex flex-col font-sans"
          style={{ maxHeight: 'calc(100dvh - 110px)' }}
        >
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <CalendarDays className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="font-bold text-white text-sm sm:text-base">Previsioni Settimanali</h3>
                <p className="text-xs font-mono text-cyan-300/80 truncate max-w-[180px] sm:max-w-none">
                  {targetName}
                </p>
              </div>
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
                className="p-2 hover:bg-white/10 rounded-full transition-all duration-300 shrink-0 text-white/70"
                data-testid="button-close-weekly"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading && (
              <div className="flex items-center justify-center h-32 text-cyan-300/70 font-mono text-sm animate-pulse">
                Caricamento previsioni settimanali...
              </div>
            )}
            {isError && (
              <div className="flex items-center justify-center h-32 text-red-400 font-mono text-sm">
                Errore. Tocca Aggiorna.
              </div>
            )}

            {days.length > 0 && (
              <>
                <div className="px-4 sm:px-6 pt-4 pb-2">
                  <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider mb-2">
                    Andamento temperature 7 giorni
                  </div>
                  <div className="h-24 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                        <YAxis domain={['dataMin - 3', 'dataMax + 3']} hide />
                        <Tooltip
                          contentStyle={{
                            background: '#0b1220',
                            border: '1px solid rgba(34,211,238,0.3)',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            color: '#e2e8f0',
                          }}
                          formatter={(val: number, name: string) => [
                            `${val}°C`,
                            name === 'max' ? 'Massima' : 'Minima',
                          ]}
                          labelFormatter={(label) => {
                            try {
                              return format(parseISO(String(label) + 'T12:00:00'), 'EEEE d MMM', {
                                locale: it,
                              });
                            } catch {
                              return String(label);
                            }
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="max"
                          stroke="#22d3ee"
                          strokeWidth={2}
                          dot={{ r: 3, fill: '#22d3ee' }}
                          isAnimationActive={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="min"
                          stroke="#38bdf8"
                          strokeWidth={1.5}
                          strokeDasharray="4 2"
                          dot={false}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="divide-y divide-white/8 px-2 sm:px-4 pb-4">
                  {days.map((day, idx) => {
                    const isToday = idx === 0;
                    const rawDay = format(day.date, 'EEEE', { locale: it });
                    const dayName = rawDay.charAt(0).toUpperCase() + rawDay.slice(1);
                    const dateLabel = format(day.date, 'd MMMM', { locale: it });
                    const allMax = Math.max(...days.map((d) => d.maxTemp));
                    const allMin = Math.min(...days.map((d) => d.minTemp));
                    const range = allMax - allMin || 1;
                    const barLeft = ((day.minTemp - allMin) / range) * 100;
                    const barWidth = ((day.maxTemp - day.minTemp) / range) * 100;

                    return (
                      <div
                        key={day.dateStr}
                        data-testid={`row-day-${day.dateStr}`}
                        className={`flex items-center gap-3 sm:gap-4 py-3 px-2 sm:px-3 rounded-xl transition-all duration-300 ${
                          isToday ? 'bg-cyan-500/10' : 'hover:bg-white/5'
                        }`}
                      >
                        <div className="w-[80px] sm:w-[96px] shrink-0">
                          <div className={`text-sm font-semibold ${isToday ? 'text-cyan-300' : 'text-white'}`}>
                            {dayName}
                          </div>
                          <div className="text-[10px] font-mono text-white/40">{dateLabel}</div>
                        </div>

                        <div className="flex items-center gap-2 w-[90px] sm:w-[130px] shrink-0">
                          {getWeatherIcon(day.dominantCode, 'w-5 h-5')}
                          <span className="text-xs text-white/50 hidden sm:block truncate">
                            {getWeatherLabel(day.dominantCode)}
                          </span>
                        </div>

                        <div className="flex-1 flex items-center gap-2 min-w-0">
                          <span className="text-xs font-mono text-white/45 w-7 text-right shrink-0">
                            {day.minTemp}°
                          </span>
                          <div className="flex-1 h-2 bg-white/10 rounded-full relative overflow-hidden">
                            <div
                              className="absolute h-full rounded-full"
                              style={{
                                left: `${barLeft}%`,
                                width: `${Math.max(barWidth, 8)}%`,
                                background: getTempGradient(day.minTemp, day.maxTemp),
                              }}
                            />
                          </div>
                          <span className="text-xs font-mono font-bold text-white w-7 shrink-0">
                            {day.maxTemp}°
                          </span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 text-[11px] font-mono">
                          {day.totalPrecip > 0 ? (
                            <div className="flex items-center gap-1 text-sky-400">
                              <Droplets className="w-3 h-3" />
                              <span>{day.totalPrecip}mm</span>
                            </div>
                          ) : (
                            <div className="w-[52px]" />
                          )}
                          <div className="hidden sm:flex items-center gap-1 text-white/45">
                            <Wind className="w-3 h-3" />
                            <span>{day.maxWind}km/h</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
