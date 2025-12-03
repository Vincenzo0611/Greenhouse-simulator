import type { SensorId } from "@/store/slices/sensorSlice";
import { addSensorDataById, setInitialLoading, setErrorById } from "@/store/slices/sensorSlice";
import type { AppDispatch } from "@/store/store";
import { fetchDataByType, groupBySensorId, getSensorPrefix, type DataType } from "./api/sensorApi";

const INITIAL_PAGE_SIZE = 1000;

export const loadInitialData = async (dispatch: AppDispatch) => {
  dispatch(setInitialLoading(true));

  console.log("Ładowanie początkowych danych sensorów z API...");

  const dataTypes: DataType[] = ["temperature", "humidity", "sunlight", "co2"];

  try {
    // Pobierz dane dla wszystkich typów równolegle (tylko 4 fetche)
    const promises = dataTypes.map(async (dataType) => {
      try {
        const apiData = await fetchDataByType(dataType, INITIAL_PAGE_SIZE);
        const groupedBySensor = groupBySensorId(apiData);

        // Dodaj dane dla każdego sensora
        Object.entries(groupedBySensor).forEach(([sensorId, entries]) => {
          const measurements = entries.map((entry) => ({
            timestamp: entry.sourceTimestamp,
            value: entry.value,
            Id: entry.id,
          }));

          dispatch(addSensorDataById({
            sensorId: sensorId as SensorId,
            data: measurements,
          }));

          console.log(`Załadowano ${measurements.length} pomiarów dla ${sensorId}`);
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`Błąd ładowania danych dla ${dataType}:`, errorMessage);
        // Ustaw błąd dla wszystkich sensorów tego typu
        const sensorPrefix = getSensorPrefix(dataType);
        for (let i = 1; i <= 4; i++) {
          dispatch(setErrorById({ 
            sensorId: `sensor-${sensorPrefix}-${i}` as SensorId, 
            error: errorMessage 
          }));
        }
      }
    });

    await Promise.all(promises);

    console.log("Zakończono ładowanie danych sensorów");
  } catch (error) {
    console.error("Błąd podczas ładowania danych:", error);
  } finally {
    dispatch(setInitialLoading(false));
  }
};