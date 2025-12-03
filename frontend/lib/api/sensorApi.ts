export interface ApiMeasurement {
  id: string;
  sourceTimestamp: string;
  value: number;
  sensorId: string;
}

export type DataType = "temperature" | "humidity" | "sunlight" | "co2";

const API_BASE_URL = "/api";

type ApiSensorData = {
  sensor: string;
  wallet: string;
  balance: number;
}

/**
 * Pobiera dane pomiarów dla konkretnego typu sensora
 */
export const fetchDataByType = async (
  dataType: DataType,
  pageSize: number = 500
): Promise<ApiMeasurement[]> => {
  const url = `${API_BASE_URL}/measurements?dataType=${dataType}&pageSize=${pageSize}&sortOrder=desc`;
  
  const response = await fetch(url);

  
  if (!response.ok) {
    throw new Error(`Failed to fetch data for ${dataType}: ${response.statusText}`);
  }
  
  return await response.json();
};

export const fetchSensorData = async () :Promise<ApiSensorData[]> =>{
  const ulr = `${API_BASE_URL}/sensors/rewards`;

  const response = await fetch(ulr);

  if(!response.ok){
    throw new Error(`Failed to fetch sensor data: ${response.statusText}`);
  }

  return await response.json();
}

export const groupBySensorId = (
  apiData: ApiMeasurement[]
): Record<string, ApiMeasurement[]> => {
  return apiData.reduce((acc, entry) => {
    if (!acc[entry.sensorId]) {
      acc[entry.sensorId] = [];
    }
    acc[entry.sensorId].push(entry);
    return acc;
  }, {} as Record<string, ApiMeasurement[]>);
};

/**
 * Mapuje prefix sensora na typ danych
 */
export const getSensorPrefix = (dataType: DataType): string => {
  const prefixMap: Record<DataType, string> = {
    temperature: "tmp",
    humidity: "hum",
    sunlight: "sun",
    co2: "co2",
  };
  return prefixMap[dataType];
};
