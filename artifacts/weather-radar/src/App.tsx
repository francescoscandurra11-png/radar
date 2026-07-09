import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import WeatherApp from './pages/WeatherApp';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={WeatherApp} />
      <Route>
        <div className="w-full h-screen flex items-center justify-center text-muted-foreground font-mono">404 - Area non mappata</div>
      </Route>
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
