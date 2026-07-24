import { AnimatePresence, motion, useEffect, useState } from 'react';
import { Menu, Home, X } from 'lucide-react';
import WeatherMap from '../components/WeatherMap';
import Sidebar from '../components/Sidebar';
import TimelineBar from '../components/TimelineBar';
import HourlyForecastPanel from '../components/HourlyForecastPanel';
import WeeklyForecastPanel from '../components/WeeklyForecastPanel';
import SevereWeatherPanel from '../components/SevereWeatherPanel';
import { useWeatherStore } from '../store/useWeatherStore';

export default function WeatherApp() {
  const { sidebarOpen, setSidebarOpen } = useWeatherStore();
  const [showInstallPopup, setShowInstallPopup] = useState(false);
  const [showHomeMenu, setShowHomeMenu] = useState(false);

  // Install popup after 30 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInstallPopup(true);
    }, 30000);
    return () => clearTimeout(timer);
  }, []);

  const handleInstall = () => {
    if ('deferredPrompt' in window) {
      (window as any).deferredPrompt.prompt();
    }
  };

  const dismissInstallPopup = () => {
    setShowInstallPopup(false);
  };

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-background">
      {/* ── Desktop sidebar (always visible ≥ md) ── */}
      <div className="hidden md:flex fixed top-0 left-0 h-[100dvh] w-[240px] bg-sidebar/95 backdrop-blur-xl border-r border-sidebar-border z-40 flex-col">
        <Sidebar />
      </div>

      {/* ── Mobile sidebar overlay ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              key="sidebar-drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="md:hidden fixed top-0 left-0 h-[100dvh] w-[280px] bg-sidebar/98 backdrop-blur-xl border-r border-sidebar-border z-50 flex flex-col"
            >
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Mobile hamburger button ── */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden fixed top-3 left-3 z-40 w-10 h-10 bg-card/90 backdrop-blur border border-border rounded-lg flex items-center justify-center shadow-lg text-foreground hover:bg-accent/20 transition-colors"
        data-testid="button-hamburger"
        aria-label="Apri menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* ── Home menu button ── */}
      <button
        onClick={() => setShowHomeMenu(!showHomeMenu)}
        className="fixed top-3 right-3 z-40 w-10 h-10 bg-card/90 backdrop-blur border border-border rounded-lg flex items-center justify-center shadow-lg text-foreground hover:bg-accent/20 transition-colors"
        aria-label="Menu Home"
      >
        <Home className="w-5 h-5" />
      </button>

      {/* ── Home menu dropdown ── */}
      <AnimatePresence>
        {showHomeMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-14 right-3 z-50 bg-card/95 backdrop-blur-xl border border-border rounded-lg shadow-xl p-4 min-w-[200px]"
          >
            <div className="space-y-2">
              <button
                onClick={() => { setShowHomeMenu(false); setSidebarOpen(true); }}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-accent/20 transition-colors flex items-center gap-2"
              >
                <Menu className="w-4 h-4" />
                Menu
              </button>
              <button
                onClick={() => { setShowHomeMenu(false); window.location.reload(); }}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-accent/20 transition-colors flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Home
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Install Popup after 30s ── */}
      <AnimatePresence>
        {showInstallPopup && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 z-50 bg-card/95 backdrop-blur-xl border border-border rounded-lg shadow-2xl p-4 max-w-sm"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-foreground">📲 Installa App</h3>
                <p className="text-xs text-muted-foreground">TFR Radar</p>
              </div>
              <button
                onClick={dismissInstallPopup}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1 mb-3">
              <li>• Radar meteo live</li>
              <li>• Previsioni dettagliate</li>
              <li>• Funziona offline</li>
            </ul>
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="flex-1 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Installa
              </button>
              <button
                onClick={dismissInstallPopup}
                className="px-3 py-2 rounded-md text-sm border border-border hover:bg-accent/20 transition-colors"
              >
                Non ora
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Map (full screen) ── */}
      <WeatherMap />

      {/* ── Bottom timeline bar ── */}
      <TimelineBar />

      {/* ── Overlay panels ── */}
      <HourlyForecastPanel />
      <WeeklyForecastPanel />
      <SevereWeatherPanel />

      {/* Noise texture overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-[5] opacity-[0.025] mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
        }}
      />
    </div>
  );
}
