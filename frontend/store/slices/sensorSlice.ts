import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Measurement, SensorId as GlobalSensorId } from "@/types";

interface SensorData {
  data: Measurement[];
  error: string | null;
  walletAddress?: string;
  balance?: number;
}

// Każdy typ czujnika ma 4 sensory z właściwymi ID
interface TemperatureSensors {
  "sensor-tmp-1": SensorData;
  "sensor-tmp-2": SensorData;
  "sensor-tmp-3": SensorData;
  "sensor-tmp-4": SensorData;
}

interface HumiditySensors {
  "sensor-hum-1": SensorData;
  "sensor-hum-2": SensorData;
  "sensor-hum-3": SensorData;
  "sensor-hum-4": SensorData;
}

interface SunlightSensors {
  "sensor-sun-1": SensorData;
  "sensor-sun-2": SensorData;
  "sensor-sun-3": SensorData;
  "sensor-sun-4": SensorData;
}

interface CO2Sensors {
  "sensor-co2-1": SensorData;
  "sensor-co2-2": SensorData;
  "sensor-co2-3": SensorData;
  "sensor-co2-4": SensorData;
}

interface SensorsState {
  initialLoading: boolean;
  temperature: TemperatureSensors;
  humidity: HumiditySensors;
  sunlight: SunlightSensors;
  co2: CO2Sensors;
}

const initialState: SensorsState = {
  initialLoading: true,
  temperature: {
    "sensor-tmp-1": { data: [], error: null, walletAddress: "", balance: 0 },
    "sensor-tmp-2": { data: [], error: null, walletAddress: "", balance: 0 },
    "sensor-tmp-3": { data: [], error: null, walletAddress: "", balance: 0 },
    "sensor-tmp-4": { data: [], error: null, walletAddress: "", balance: 0 },
  },
  humidity: {
    "sensor-hum-1": { data: [], error: null, walletAddress: "", balance: 0 },
    "sensor-hum-2": { data: [], error: null, walletAddress: "", balance: 0 },
    "sensor-hum-3": { data: [], error: null, walletAddress: "", balance: 0 },
    "sensor-hum-4": { data: [], error: null, walletAddress: "", balance: 0 },
  },
  sunlight: {
    "sensor-sun-1": { data: [], error: null, walletAddress: "", balance: 0 },
    "sensor-sun-2": { data: [], error: null, walletAddress: "", balance: 0 },
    "sensor-sun-3": { data: [], error: null, walletAddress: "", balance: 0 },
    "sensor-sun-4": { data: [], error: null, walletAddress: "", balance: 0 },
  },
  co2: {
    "sensor-co2-1": { data: [], error: null, walletAddress: "", balance: 0 },
    "sensor-co2-2": { data: [], error: null, walletAddress: "", balance: 0 },
    "sensor-co2-3": { data: [], error: null, walletAddress: "", balance: 0 },
    "sensor-co2-4": { data: [], error: null, walletAddress: "", balance: 0 },
  },
};

// Eksportuj typ SensorId z globalnych typów
export type SensorId = GlobalSensorId;

const sensorSlice = createSlice({
  name: "sensors",
  initialState,
  reducers: {
    // Dodaje dane używając bezpośrednio ID sensora (np. "sensor-tmp-1")
    addSensorDataById: (
      state,
      action: PayloadAction<{ sensorId: SensorId; data: Measurement[] }>
    ) => {
      const { sensorId, data } = action.payload;

      // Funkcja pomocnicza do filtrowania duplikatów
      const addUniqueData = (
        existingData: Measurement[],
        newData: Measurement[]
      ) => {
        const existingKeys = new Set(
          existingData.map((item) => `${item.Id}-${item.timestamp}`)
        );
        const uniqueData = newData.filter(
          (item) => !existingKeys.has(`${item.Id}-${item.timestamp}`)
        );
        existingData.push(...uniqueData);
      };

      // Automatycznie wykryj typ na podstawie ID
      if (sensorId.startsWith("sensor-tmp-")) {
        addUniqueData((state.temperature as any)[sensorId].data, data);
      } else if (sensorId.startsWith("sensor-hum-")) {
        addUniqueData((state.humidity as any)[sensorId].data, data);
      } else if (sensorId.startsWith("sensor-sun-")) {
        addUniqueData((state.sunlight as any)[sensorId].data, data);
      } else if (sensorId.startsWith("sensor-co2-")) {
        addUniqueData((state.co2 as any)[sensorId].data, data);
      }
    },
    setSensorWalletById: (
      state,
      action: PayloadAction<{
        sensorId: SensorId;
        walletAddress: string;
        balance: number;
      }>
    ) => {
      const { sensorId, walletAddress, balance } = action.payload;

      if (sensorId.startsWith("sensor-tmp-")) {
        (state.temperature as any)[sensorId].walletAddress = walletAddress;
        (state.temperature as any)[sensorId].balance = balance;
      } else if (sensorId.startsWith("sensor-hum-")) {
        (state.humidity as any)[sensorId].walletAddress = walletAddress;
        (state.humidity as any)[sensorId].balance = balance;
      } else if (sensorId.startsWith("sensor-sun-")) {
        (state.sunlight as any)[sensorId].walletAddress = walletAddress;
        (state.sunlight as any)[sensorId].balance = balance;
      } else if (sensorId.startsWith("sensor-co2-")) {
        (state.co2 as any)[sensorId].walletAddress = walletAddress;
        (state.co2 as any)[sensorId].balance = balance;
      }
    },
    // Ustawia globalny stan ładowania początkowego
    setInitialLoading: (state, action: PayloadAction<boolean>) => {
      state.initialLoading = action.payload;
    },
    // Ustawia błąd używając ID sensora
    setErrorById: (
      state,
      action: PayloadAction<{ sensorId: SensorId; error: string | null }>
    ) => {
      const { sensorId, error } = action.payload;
      if (sensorId.startsWith("sensor-tmp-")) {
        (state.temperature as any)[sensorId].error = error;
      } else if (sensorId.startsWith("sensor-hum-")) {
        (state.humidity as any)[sensorId].error = error;
      } else if (sensorId.startsWith("sensor-sun-")) {
        (state.sunlight as any)[sensorId].error = error;
      } else if (sensorId.startsWith("sensor-co2-")) {
        (state.co2 as any)[sensorId].error = error;
      }
    },
  },
});



export const { addSensorDataById, setInitialLoading, setErrorById, setSensorWalletById } =
  sensorSlice.actions;

export default sensorSlice.reducer;
