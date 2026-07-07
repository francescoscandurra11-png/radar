import { AnimatePresence, motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import WeatherMap from '../components/WeatherMap';
import Sidebar from '../components/Sidebar';
import TimelineBar from '../components/TimelineBar';
import HourlyForecastPanel from '../components/HourlyForecastPanel';
import WeeklyForecastPanel from '../components/WeeklyForecastPanel';
import SevereWeatherPanel from '../components/SevereWeatherPanel';
import FlightsPanel from '../components/FlightsPanel';
import { useWeatherStore } from '../store/useWeatherStore';

export default function WeatherApp() {
  const { sidebarOpen, setSidebarOpen } = useWeatherStore();

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

      {/* ── Map (full screen) ── */}
      <WeatherMap />

      {/* ── Bottom timeline bar ── */}
      <TimelineBar />

      {/* ── Overlay panels ── */}
      <HourlyForecastPanel />
      <WeeklyForecastPanel />
      <SevereWeatherPanel />
      <FlightsPanel />

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
