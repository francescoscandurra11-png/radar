import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import WeatherApp from './pages/WeatherApp';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={WeatherApp} />
      <Route path="/the_final_radar.html" component={WeatherApp} />
      <Route component={WeatherApp} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Router />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
