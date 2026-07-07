import { AnimatePresence, motion } from 'framer-motion';
import { X, Tornado, Waves, Zap, AlertTriangle, AlertCircle, AlertOctagon } from 'lucide-react';
import { useWeatherStore } from '../store/useWeatherStore';
import { useSevereWeather } from '../hooks/useSevereWeather';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function SevereWeatherPanel() {
  const { activePanel, setActivePanel } = useWeatherStore();
  const { data: alerts, isLoading } = useSevereWeather();

  const isOpen = activePanel === 'severe';

  const getSeverityStyle = (severity: string) => {
    switch ((severity || '').toLowerCase()) {
      case 'extreme': return 'bg-destructive/20 text-destructive border-destructive/50';
      case 'severe': return 'bg-orange-500/20 text-orange-500 border-orange-500/50';
      case 'moderate': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
      default: return 'bg-blue-500/20 text-blue-500 border-blue-500/50';
    }
  };

  const getEventIcon = (event: string) => {
    const e = (event || '').toLowerCase();
    if (e.includes('tornado')) return <Tornado className="w-5 h-5" />;
    if (e.includes('hurricane') || e.includes('tropical') || e.includes('cyclone') || e.includes('typhoon')) return <Waves className="w-5 h-5" />;
    if (e.includes('thunderstorm')) return <Zap className="w-5 h-5" />;
    return <AlertTriangle className="w-5 h-5" />;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-[60px] right-0 top-0 w-full sm:w-[400px] bg-card/95 backdrop-blur-xl border-l border-border z-30 shadow-2xl flex flex-col font-sans"
        >
          <div className="flex items-center justify-between p-5 border-b border-border/50 bg-destructive/5">
            <div className="flex items-center gap-3 text-destructive">
              <AlertOctagon className="w-6 h-6 animate-pulse" />
              <h3 className="font-bold text-lg">Allerte Severe</h3>
              {alerts && <span className="bg-destructive text-white text-xs font-bold px-2 py-0.5 rounded-full">{alerts.length}</span>}
            </div>
            <button 
              onClick={() => setActivePanel(null)}
              className="p-2 text-muted-foreground hover:bg-accent/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoading && (
              <div className="text-center py-10 font-mono text-sm text-muted-foreground animate-pulse">
                Ricerca allerte globali in corso...
              </div>
            )}

            {!isLoading && (!alerts || alerts.length === 0) && (
              <div className="text-center py-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-green-500" />
                </div>
                <div className="font-bold text-lg mb-1 text-green-500">Nessuna allerta severa</div>
                <div className="text-sm font-mono text-muted-foreground">Area attualmente sicura</div>
              </div>
            )}

            {alerts?.map((alert) => (
              <div key={alert.id} className="bg-sidebar-accent/30 border border-border/50 rounded-lg overflow-hidden flex flex-col">
                <div className="p-3 border-b border-border/50 flex items-center gap-3">
                  <div className={`p-2 rounded-md ${getSeverityStyle(alert.severity)}`}>
                    {getEventIcon(alert.event)}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm leading-tight text-foreground">{alert.event}</div>
                    <div className="text-xs font-mono text-muted-foreground truncate">{alert.areaDesc}</div>
                  </div>
                </div>
                <div className="p-4 bg-background/50">
                  <div className="text-xs font-mono text-primary mb-2 uppercase tracking-wider">
                    Emessa: {format(new Date(alert.onset), "dd MMM HH:mm", { locale: it })}
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed font-sans">{alert.headline}</p>
                  
                  {/* Detailed expandable text could go here, but keeping it brief for the panel */}
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed">
                      {alert.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
