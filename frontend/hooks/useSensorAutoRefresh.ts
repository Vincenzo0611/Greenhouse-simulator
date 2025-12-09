"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch } from "@/store/hooks";
import {
  addSensorDataById,
  setErrorById,
  setSensorWalletById,
} from "@/store/slices/sensorSlice";
import type { SensorId } from "@/store/slices/sensorSlice";
import {
  fetchDataByType,
  groupBySensorId,
  getSensorPrefix,
  type DataType,
  fetchSensorData,
} from "@/lib/api/sensorApi";

const REFRESH_INTERVAL = 10000; // 10 sekund - zwiększone żeby backend miał czas wygenerować nowe dane
const REFRESH_PAGE_SIZE = 50; // Pobierz więcej pomiarów, żeby złapać nowe

/**
 * Hook do automatycznego odświeżania danych sensorów
 */
export const useSensorAutoRefresh = () => {
  const dispatch = useAppDispatch();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const dataTypes: DataType[] = [
      "temperature",
      "humidity",
      "sunlight",
      "co2",
    ];

    const refreshData = async () => {
      // Pobierz dane dla wszystkich typów równolegle

      const sensorData = await fetchSensorData();
      sensorData.map((data) =>
        dispatch(
          setSensorWalletById({
            sensorId: data.sensor as SensorId,
            walletAddress: data.wallet,
            balance: data.balance,
          })
        )
      );

      const promises = dataTypes.map(async (dataType) => {
        try {
          const apiData = await fetchDataByType(dataType, REFRESH_PAGE_SIZE);
          console.log("apiData", dataType, apiData[0]);
          const groupedBySensor = groupBySensorId(apiData);

          // Dodaj nowe dane dla każdego sensora
          Object.entries(groupedBySensor).forEach(([sensorId, entries]) => {
            const measurements = entries.map((entry) => ({
              timestamp: entry.sourceTimestamp,
              value: entry.value,
              Id: entry.id,
            }));

            dispatch(
              addSensorDataById({
                sensorId: sensorId as SensorId,
                data: measurements,
              })
            );
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          console.error(
            `Błąd odświeżania danych dla ${dataType}:`,
            errorMessage
          );

          // Ustaw błąd dla wszystkich sensorów tego typu
          const sensorPrefix = getSensorPrefix(dataType);
          for (let i = 1; i <= 4; i++) {
            dispatch(
              setErrorById({
                sensorId: `sensor-${sensorPrefix}-${i}` as SensorId,
                error: errorMessage,
              })
            );
          }
        }
      });

      await Promise.all(promises);
    };

    // Rozpocznij automatyczne odświeżanie
    intervalRef.current = setInterval(refreshData, REFRESH_INTERVAL);

    // Cleanup przy unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [dispatch]);
};
