import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Sun, Cloud, CloudRain, CloudSnow, Zap, CloudFog, CalendarDays, Droplets, Wind } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useWeatherStore } from '../store/useWeatherStore';
import { useForecast } from '../hooks/useForecast';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';

const getWeatherIcon = (code: number, size = 'w-6 h-6') => {
  if (code === 0) return <Sun className={`${size} text-yellow-400`} />;
  if (code >= 1 && code <= 3) return <Cloud className={`${size} text-slate-400`} />;
  if (code >= 45 && code <= 48) return <CloudFog className={`${size} text-slate-400`} />;
  if (code >= 51 && code <= 67) return <CloudRain className={`${size} text-blue-400`} />;
  if (code >= 71 && code <= 77) return <CloudSnow className={`${size} text-sky-200`} />;
  if (code >= 80 && code <= 82) return <CloudRain className={`${size} text-blue-500`} />;
  if (code >= 95 && code <= 99) return <Zap className={`${size} text-yellow-400`} />;
  return <Sun className={`${size} text-yellow-400`} />;
};

const getWeatherLabel = (code: number): string => {
  if (code === 0) return 'Sereno';
  if (code >= 1 && code <= 2) return 'Parzialmente nuvoloso';
  if (code === 3) return 'Coperto';
  if (code >= 45 && code <= 48) return 'Nebbia';
  if (code >= 51 && code <= 55) return 'Pioggerella';
  if (code >= 56 && code <= 57) return 'Pioggerella gelata';
  if (code >= 61 && code <= 65) return 'Pioggia';
  if (code >= 66 && code <= 67) return 'Pioggia gelata';
  if (code >= 71 && code <= 75) return 'Neve';
  if (code === 77) return 'Granelli di neve';
  if (code >= 80 && code <= 82) return 'Rovesci';
  if (code === 85 || code === 86) return 'Rovesci di neve';
  if (code === 95) return 'Temporale';
  if (code >= 96 && code <= 99) return 'Temporale con grandine';
  return 'Variabile';
};

const getTempGradient = (min: number, max: number) => {
  // Returns a CSS gradient representing the temp range
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
  const { activePanel, setActivePanel, selectedLocation, mapCenter } = useWeatherStore();

  const targetLat = selectedLocation?.lat ?? mapCenter[0];
  const targetLon = selectedLocation?.lon ?? mapCenter[1];
  const targetName = selectedLocation?.name ?? `${targetLat.toFixed(2)}°N, ${targetLon.toFixed(2)}°E`;

  const { data: forecast, isLoading } = useForecast(targetLat, targetLon);

  const isOpen = activePanel === 'weekly';

  // Group hourly → daily summaries
  const days = useMemo(() => {
    if (!forecast) return [];

    const map = new Map<string, {
      temps: number[]; precips: number[]; winds: number[]; codes: number[];
    }>();

    forecast.time.forEach((t, i) => {
      const key = t.slice(0, 10);
      if (!map.has(key)) map.set(key, { temps: [], precips: [], winds: [], codes: [] });
      const d = map.get(key)!;
      d.temps.push(forecast.temperature_2m[i]);
      d.precips.push(forecast.precipitation[i]);
      d.winds.push(forecast.windspeed_10m[i]);
      d.codes.push(forecast.weathercode[i]);
    });

    return Array.from(map.entries()).map(([dateStr, d]) => {
      // Dominant weather code = most frequent
      const codeFreq: Record<number, number> = {};
      d.codes.forEach(c => { codeFreq[c] = (codeFreq[c] ?? 0) + 1; });
      const dominantCode = Number(Object.entries(codeFreq).sort((a, b) => b[1] - a[1])[0][0]);

      return {
        date: new Date(dateStr + 'T12:00:00'),
        dateStr,
        minTemp: Math.round(Math.min(...d.temps)),
        maxTemp: Math.round(Math.max(...d.temps)),
        totalPrecip: parseFloat(d.precips.reduce((a, b) => a + b, 0).toFixed(1)),
        maxWind: Math.round(Math.max(...d.winds)),
        dominantCode,
        hourlyTemps: d.temps,
      };
    });
  }, [forecast]);

  // Chart data: one point per day (max temp)
  const chartData = days.map(d => ({ date: d.dateStr, max: d.maxTemp, min: d.minTemp }));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          className="fixed bottom-[60px] left-0 right-0 md:left-[240px] bg-card/97 backdrop-blur-xl border-t border-border z-30 shadow-2xl flex flex-col font-sans"
          style={{ maxHeight: 'calc(100dvh - 120px)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border/50 shrink-0">
            <div className="flex items-center gap-3">
              <CalendarDays className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-bold text-foreground text-sm sm:text-base">Previsioni Settimanali</h3>
                <p className="text-xs font-mono text-muted-foreground truncate max-w-[180px] sm:max-w-none">{targetName}</p>
              </div>
            </div>
            <button
              onClick={() => setActivePanel(null)}
              className="p-2 hover:bg-accent/20 rounded-full transition-colors shrink-0"
              data-testid="button-close-weekly"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {isLoading && (
              <div className="flex items-center justify-center h-32 text-muted-foreground font-mono text-sm animate-pulse">
                Caricamento previsioni settimanali...
              </div>
            )}

            {days.length > 0 && (
              <>
                {/* 7-day temperature chart */}
                <div className="px-4 sm:px-6 pt-4 pb-2">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">Andamento temperature 7 giorni</div>
                  <div className="h-24 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                        <YAxis domain={['dataMin - 3', 'dataMax + 3']} hide />
                        <Tooltip
                          contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace' }}
                          formatter={(val: number, name: string) => [`${val}°C`, name === 'max' ? 'Massima' : 'Minima']}
                          labelFormatter={(label) => {
                            try { return format(new Date(label + 'T12:00:00'), 'EEEE d MMM', { locale: it }); } catch { return label; }
                          }}
                        />
                        <Line type="monotone" dataKey="max" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3, fill: 'hsl(var(--primary))' }} isAnimationActive={false} />
                        <Line type="monotone" dataKey="min" stroke="hsl(200 60% 50%)" strokeWidth={1.5} strokeDasharray="4 2" dot={false} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Day rows */}
                <div className="divide-y divide-border/40 px-2 sm:px-4 pb-4">
                  {days.map((day, idx) => {
                    const isToday = idx === 0;
                    const rawDay = format(day.date, 'EEEE', { locale: it });
                    const dayName = rawDay.charAt(0).toUpperCase() + rawDay.slice(1);
                    const dateLabel = format(day.date, 'd MMMM', { locale: it });

                    // Temp bar width relative to range across all days
                    const allMax = Math.max(...days.map(d => d.maxTemp));
                    const allMin = Math.min(...days.map(d => d.minTemp));
                    const range = allMax - allMin || 1;
                    const barLeft = ((day.minTemp - allMin) / range) * 100;
                    const barWidth = ((day.maxTemp - day.minTemp) / range) * 100;

                    return (
                      <div
                        key={day.dateStr}
                        data-testid={`row-day-${day.dateStr}`}
                        className={`flex items-center gap-3 sm:gap-4 py-3 px-2 sm:px-3 rounded-lg transition-colors ${isToday ? 'bg-primary/5' : 'hover:bg-accent/10'}`}
                      >
                        {/* Day name */}
                        <div className="w-[80px] sm:w-[96px] shrink-0">
                          <div className={`text-sm font-semibold ${isToday ? 'text-primary' : 'text-foreground'}`}>{dayName}</div>
                          <div className="text-[10px] font-mono text-muted-foreground">{dateLabel}</div>
                        </div>

                        {/* Icon + label */}
                        <div className="flex items-center gap-2 w-[90px] sm:w-[130px] shrink-0">
                          {getWeatherIcon(day.dominantCode, 'w-5 h-5')}
                          <span className="text-xs text-muted-foreground hidden sm:block truncate">{getWeatherLabel(day.dominantCode)}</span>
                        </div>

                        {/* Temp range bar */}
                        <div className="flex-1 flex items-center gap-2 min-w-0">
                          <span className="text-xs font-mono text-muted-foreground w-7 text-right shrink-0">{day.minTemp}°</span>
                          <div className="flex-1 h-2 bg-border/40 rounded-full relative overflow-hidden">
                            <div
                              className="absolute h-full rounded-full"
                              style={{
                                left: `${barLeft}%`,
                                width: `${Math.max(barWidth, 8)}%`,
                                background: getTempGradient(day.minTemp, day.maxTemp),
                              }}
                            />
                          </div>
                          <span className="text-xs font-mono font-bold text-foreground w-7 shrink-0">{day.maxTemp}°</span>
                        </div>

                        {/* Precip + Wind */}
                        <div className="flex items-center gap-3 shrink-0 text-[11px] font-mono">
                          {day.totalPrecip > 0 ? (
                            <div className="flex items-center gap-1 text-blue-400" title="Precipitazioni">
                              <Droplets className="w-3 h-3" />
                              <span>{day.totalPrecip}mm</span>
                            </div>
                          ) : (
                            <div className="w-[52px]" />
                          )}
                          <div className="hidden sm:flex items-center gap-1 text-muted-foreground" title="Vento massimo">
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
