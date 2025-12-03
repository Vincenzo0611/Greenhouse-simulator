import { SensorType } from "@/types";

export const colorBgMap = {
  temperature: "bg-red-200",
  humidity: "bg-blue-200",
  sunlight: "bg-yellow-200",
  co2: "bg-green-200",
};

export const colorChartMap: Record<SensorType, string[]> = {
  temperature: ["oklch(80.8% 0.114 19.571)", "oklch(63.7% 0.237 25.331)", "oklch(44.4% 0.177 26.899)", "oklch(25.8% 0.092 26.042)"],
  humidity: ["oklch(80.9% 0.105 251.813)", "oklch(62.3% 0.214 259.815)", "oklch(48.8% 0.243 264.376)", "oklch(28.2% 0.091 267.935)"],
  sunlight: ["oklch(90.5% 0.182 98.111)", "oklch(79.5% 0.184 86.047)", "oklch(55.4% 0.135 66.442)", "oklch(28.6% 0.066 53.813)"],
  co2: ["oklch(87.1% 0.15 154.449)", "oklch(72.3% 0.219 149.579)", "oklch(44.8% 0.119 151.328)", "oklch(26.6% 0.065 152.934)"],
};

export const getSensorPrefix = (sensorType: SensorType) => {
  const prefixMap = {
    temperature: "tmp",
    humidity: "hum",
    sunlight: "sun",
    co2: "co2",
  };
  return prefixMap[sensorType];
};
