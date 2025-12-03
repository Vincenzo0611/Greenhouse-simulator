"use client";

import { colorBgMap, getSensorPrefix } from "@/lib/sensorTypes/utils";
import { useAppSelector, selectAllSensorsOfType } from "@/store/hooks";
import {
  SensorType,
  SENSOR_NAMES,
  SENSOR_UNITS,
  Measurement,
  SENSOR_ICONS,
} from "@/types";
import { History } from "lucide-react";

interface AverageValueProps {
  sensorType: SensorType;
}

const AverageValue = ({ sensorType }: AverageValueProps) => {
  const sensors = useAppSelector((state) =>
    selectAllSensorsOfType(state, sensorType)
  );

  // Oblicz średnią dla pojedynczego sensora
  const calculateSensorAverage = (sensorData: Measurement[]) => {
    if (sensorData.length === 0) return 0;
    const sum = sensorData.reduce(
      (acc, measurement) => acc + measurement.value,
      0
    );
    return (sum / sensorData.length).toFixed(2);
  };

  const getLastMeasurement = (sensorData: Measurement[]) => {
    if (sensorData.length === 0) return null;
    return sensorData[sensorData.length - 1];
  };

  // Oblicz średnią ze wszystkich 4 sensorów
  const calculateOverallAverage = () => {
    const allValues: number[] = [];

    Object.values(sensors).forEach((sensor) => {
      sensor.data.forEach((measurement: Measurement) => {
        allValues.push(measurement.value);
      });
    });

    if (allValues.length === 0) return 0;

    const sum = allValues.reduce((acc, val) => acc + val, 0);
    return (sum / allValues.length).toFixed(2);
  };

  const overallAverage = calculateOverallAverage();

  // Pobierz prefix ID dla danego typu sensora
 

  const prefix = getSensorPrefix(sensorType);

  const Icon = SENSOR_ICONS[sensorType];


  const colorBg = colorBgMap[sensorType];

  return (
    <div className="space-y-4 shadow-xs border bg-card  p-3 rounded-xl">
      {/* Ogólna średnia */}
      <div className="p-4 rounded-lg flex items-center flex-row-reverse justify-between  bg-card">
        <div className={`${colorBg} rounded-full p-3`}>
          <Icon size="40px" className="text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Średnia ogólna - {SENSOR_NAMES[sensorType]}
          </h3>
          <p className="text-3xl font-bold">
            {overallAverage} {SENSOR_UNITS[sensorType]}
          </p>
        </div>
      </div>

      {/* Średnie dla każdego sensora */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((num) => {
          const sensorId = `sensor-${prefix}-${num}`;
          const sensor = (sensors as any)[sensorId];
          const sensorData = sensor?.data || [];
          const average = calculateSensorAverage(sensorData);
          const lastMeasurement = getLastMeasurement(sensorData) || {
            value: "Brak danych",
          };

          return (
            <div key={sensorId} className="p-3 border rounded-lg  bg-card">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-medium text-muted-foreground ">
                  Sensor {num}
                </h4>
               
              </div>
              <div className="flex items-center gap-1 mb-2">
                <History size={20} />
                <p className="text-sm font-semibold">{lastMeasurement.value} {SENSOR_UNITS[sensorType]}</p>
              </div>
              <p className="text-xs">
                Średnia:{" "}
                {average} {SENSOR_UNITS[sensorType]}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AverageValue;
