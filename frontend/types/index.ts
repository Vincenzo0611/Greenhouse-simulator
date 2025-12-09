// Globalne typy dla całej aplikacji

import { Cloudy, Droplets, Sun, ThermometerSun } from "lucide-react";
import { ElementType } from "react";

export interface Measurement {
  timestamp: string;
  value: number;
  Id: string;
}

export type SensorType = "temperature" | "humidity" | "sunlight" | "co2";

export type SensorId =
  | "sensor-tmp-1"
  | "sensor-tmp-2"
  | "sensor-tmp-3"
  | "sensor-tmp-4"
  | "sensor-hum-1"
  | "sensor-hum-2"
  | "sensor-hum-3"
  | "sensor-hum-4"
  | "sensor-sun-1"
  | "sensor-sun-2"
  | "sensor-sun-3"
  | "sensor-sun-4"
  | "sensor-co2-1"
  | "sensor-co2-2"
  | "sensor-co2-3"
  | "sensor-co2-4";

// Mapy dla wygody
export const SENSOR_NAMES: Record<SensorType, string> = {
  temperature: "Temperatura",
  humidity: "Wilgotność",
  sunlight: "Nasłonecznienie",
  co2: "CO2",
};


export const SENSOR_ICONS: Record<SensorType, ElementType> = {
  temperature: ThermometerSun,
  humidity: Droplets,
  sunlight: Sun,
  co2: Cloudy,
};



export const SENSOR_UNITS: Record<SensorType, string> = {
  temperature: "°C",
  humidity: "%",
  sunlight: "lux",
  co2: "ppm",
};
