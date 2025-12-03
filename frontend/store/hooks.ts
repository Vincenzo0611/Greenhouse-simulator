import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./store";
import type { SensorId, SensorType } from "@/types";

// Hooki - dokładnie tak jak w JS, tylko z typami
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <T,>(selector: (state: RootState) => T): T => useSelector(selector);

// Selektor globalnego stanu ładowania początkowego
export const selectInitialLoading = (state: RootState) => state.sensors.initialLoading;

// Selektory używające bezpośrednio ID sensora
export const selectSensorDataById = (state: RootState, sensorId: SensorId) => {
  if (sensorId.startsWith("sensor-tmp-")) {
    return state.sensors.temperature[sensorId as keyof typeof state.sensors.temperature].data;
  } else if (sensorId.startsWith("sensor-hum-")) {
    return state.sensors.humidity[sensorId as keyof typeof state.sensors.humidity].data;
  } else if (sensorId.startsWith("sensor-sun-")) {
    return state.sensors.sunlight[sensorId as keyof typeof state.sensors.sunlight].data;
  } else if (sensorId.startsWith("sensor-co2-")) {
    return state.sensors.co2[sensorId as keyof typeof state.sensors.co2].data;
  }
  return [];
};

export const selectSensorErrorById = (state: RootState, sensorId: SensorId) => {
  if (sensorId.startsWith("sensor-tmp-")) {
    return state.sensors.temperature[sensorId as keyof typeof state.sensors.temperature].error;
  } else if (sensorId.startsWith("sensor-hum-")) {
    return state.sensors.humidity[sensorId as keyof typeof state.sensors.humidity].error;
  } else if (sensorId.startsWith("sensor-sun-")) {
    return state.sensors.sunlight[sensorId as keyof typeof state.sensors.sunlight].error;
  } else if (sensorId.startsWith("sensor-co2-")) {
    return state.sensors.co2[sensorId as keyof typeof state.sensors.co2].error;
  }
  return null;
};

// Selektor do pobrania wszystkich 4 sensorów danego typu
export const selectAllSensorsOfType = (
  state: RootState,
  sensorType: SensorType
) => state.sensors[sensorType];
