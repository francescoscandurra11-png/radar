export interface RadarFrame {
  time: number;
  path: string;
}

export interface RainViewerData {
  version: string;
  generated: number;
  host: string;
  radar: {
    past: RadarFrame[];
    nowcast: RadarFrame[];
  };
  satellite: {
    infrared: RadarFrame[];
  };
}

export interface FlightState {
  icao24: string;
  callsign: string;
  originCountry: string;
  lon: number;
  lat: number;
  altitude: number;
  velocity: number;
  heading: number;
}

export interface HourlyForecast {
  time: string[];
  temperature_2m: number[];
  precipitation: number[];
  weathercode: number[];
  windspeed_10m: number[];
  relativehumidity_2m?: number[];
  apparent_temperature?: number[];
}

export interface SevereAlert {
  id: string;
  event: string;
  severity: string;
  headline: string;
  description: string;
  areaDesc: string;
  onset: string;
  lat?: number;
  lon?: number;
}
