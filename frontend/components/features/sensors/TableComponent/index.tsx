"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSensorPrefix } from "@/lib/sensorTypes/utils";
import { selectAllSensorsOfType, useAppSelector } from "@/store/hooks";
import { SensorType, Measurement, SENSOR_UNITS } from "@/types";
import { DataTable } from "@/components/common/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Download, FileBraces } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type TableComponentProps = {
  sensorType: SensorType;
};

type MeasurementWithSensor = Measurement & { sensorId: string };

const TableComponent = ({ sensorType }: TableComponentProps) => {
  const sensors = useAppSelector((state) =>
    selectAllSensorsOfType(state, sensorType)
  );

  const prefix = getSensorPrefix(sensorType);
  const unit = SENSOR_UNITS[sensorType];

  // Kolumny dla tabeli ze wszystkimi pomiarami
  const allMeasurementsColumns: ColumnDef<MeasurementWithSensor>[] = [
    {
      accessorKey: "Id",
      header: "ID Pomiaru",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.getValue<string>("Id")}</span>
      ),
    },
    {
      accessorKey: "timestamp",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Data i godzina
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return new Date(row.getValue<string>("timestamp")).toLocaleString(
          "pl-PL"
        );
      },
    },
    {
      accessorKey: "value",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Wartość ({unit})
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return (
          <span className="font-semibold">
            {row.getValue<number>("value").toFixed(2)} {unit}
          </span>
        );
      },
    },
    {
      accessorKey: "sensorId",
      header: "Sensor",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.getValue("sensorId")}
        </span>
      ),
    },
  ];

  // Kolumny dla tabeli pojedynczego sensora
  const singleSensorColumns: ColumnDef<Measurement>[] = [
    {
      accessorKey: "Id",
      header: "ID Pomiaru",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.getValue<string>("Id")}</span>
      ),
    },
    {
      accessorKey: "timestamp",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Data i godzina
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return new Date(row.getValue<string>("timestamp")).toLocaleString(
          "pl-PL"
        );
      },
    },
    {
      accessorKey: "value",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Wartość ({unit})
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return (
          <span className="font-semibold">
            {row.getValue<number>("value").toFixed(2)} {unit}
          </span>
        );
      },
    },
  ];

  // Zbierz wszystkie pomiary ze wszystkich sensorów
  const getAllMeasurements = (): MeasurementWithSensor[] => {
    const allMeasurements: MeasurementWithSensor[] = [];

    Object.entries(sensors).forEach(([sensorId, sensor]) => {
      sensor.data.forEach((measurement: Measurement) => {
        allMeasurements.push({ ...measurement, sensorId });
      });
    });

    return allMeasurements;
  };

  const allMeasurements = getAllMeasurements();
  const allMeasurementsSorted = [...allMeasurements].sort(
    (a: MeasurementWithSensor, b: MeasurementWithSensor) =>
      a.timestamp > b.timestamp ? -1 : 1
  );

  return (
    <div>
      <Tabs defaultValue="all" className="w-full">
        <div className="flex items-stretch justify-between">
          <TabsList className=" w-200">
            <TabsTrigger className="px-6" value="all">
              Wszystkie ({allMeasurements.length})
            </TabsTrigger>
            {[1, 2, 3, 4].map((sensorNum) => {
              const sensorId = `sensor-${prefix}-${sensorNum}`;
              const sensorData = (sensors as any)[sensorId]?.data || [];
              return (
                <TabsTrigger key={sensorNum} className="px-6" value={sensorId}>
                  Sensor {sensorNum} ({sensorData.length})
                </TabsTrigger>
              );
            })}
          </TabsList>
          <div className="flex items-stretch gap-2">
            <a
              className="flex text-xs gap-1 items-center border px-4 py-1 rounded-lg shadow-xs "
              href={"http://localhost:8080/measurements?format=csv"}
            >
              Pobierz CSV
              <Download size={15} />
            </a>
            <a
              className="flex gap-1 text-xs items-center border px-4 py-1 rounded-lg shadow-xs "
              href={"http://localhost:8080/measurements?format=json"}
            >
              Pobierz JSON
              <FileBraces size={15} className="text-orange-600" />
            </a>
          </div>
        </div>

        {/* Wszystkie pomiary */}
        <TabsContent value="all" className="mt-4">
          <DataTable
            columns={allMeasurementsColumns}
            data={allMeasurementsSorted}
            searchKey="sensorId"
            searchPlaceholder="Szukaj po ID sensora..."
            enableDateFilter={true}
            dateKey="timestamp"
          />
        </TabsContent>

        {/* Tabele dla każdego sensora osobno */}
        {[1, 2, 3, 4].map((sensorNum) => {
          const sensorId = `sensor-${prefix}-${sensorNum}`;
          const sensorData = (sensors as any)[sensorId]?.data || [];
          const sensorDataSorted = [...sensorData].sort(
            (a: Measurement, b: Measurement) =>
              a.timestamp > b.timestamp ? -1 : 1
          );

          return (
            <TabsContent key={sensorId} value={sensorId} className="mt-4">
              <DataTable
                columns={singleSensorColumns}
                data={sensorDataSorted}
                searchKey="Id"
                searchPlaceholder="Szukaj po ID pomiaru..."
                enableDateFilter={true}
                dateKey="timestamp"
              />
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default TableComponent;
