"use client";

import { useParams } from "next/navigation";
import { SENSOR_ICONS, SENSOR_NAMES, SensorType } from "@/types";
import { Sprout } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import TableComponent from "@/components/features/sensors/TableComponent";
import ChartComponent from "@/components/features/sensors/ChartComponent";
import { colorBgMap } from "@/lib/sensorTypes/utils";

const SensorTypeTable = () => {
  const { sensorType } = useParams();

  // Sprawdź czy sensorType jest prawidłowy
  const validSensorTypes: SensorType[] = [
    "temperature",
    "humidity",
    "sunlight",
    "co2",
  ];

  if (!validSensorTypes.includes(sensorType as SensorType)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Sprout size={70} className="mb-4 text-green-600" />
        <h1 className="text-4xl font-bold mb-4">Sensor nie znaleziony</h1>
        <p className="text-muted-foreground">
          Sensor typu <span className="italic">"{sensorType}"</span> nie
          istnieje
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Dostępne typy:{" "}
          <span className="font-bold">{validSensorTypes.join(", ")}</span>
        </p>
      </div>
    );
  }

  // Teraz TypeScript wie że sensorType jest prawidłowy
  const validSensorType = sensorType as SensorType;

  const Icon = SENSOR_ICONS[validSensorType];

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold  mb-4 flex items-center">
        <div
          className={`w-4 h-4 rounded-full mt-1 ${colorBgMap[validSensorType]} mr-2`}
        ></div>
        {SENSOR_NAMES[validSensorType]}
        <Icon className=" ml-2 text-primary" size={30} />
      </h1>
      <Tabs defaultValue="tables" className="w-full">
        <TabsList className="w-200">
          <TabsTrigger value="tables">Tabele</TabsTrigger>
          <TabsTrigger value="chart">Wykresy</TabsTrigger>
        </TabsList>
        <TabsContent value="tables">
          <TableComponent sensorType={validSensorType} />
        </TabsContent>
        <TabsContent value="chart">
          <ChartComponent sensorType={validSensorType} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SensorTypeTable;
