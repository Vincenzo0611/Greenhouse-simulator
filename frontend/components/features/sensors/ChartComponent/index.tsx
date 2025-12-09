"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { colorChartMap, getSensorPrefix } from "@/lib/sensorTypes/utils";
import { selectAllSensorsOfType, useAppSelector } from "@/store/hooks";
import { SensorType, Measurement, SENSOR_UNITS, SENSOR_NAMES } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type ChartComponentProps = {
  sensorType: SensorType;
};

const ChartComponent = ({ sensorType }: ChartComponentProps) => {
  const sensors = useAppSelector((state) =>
    selectAllSensorsOfType(state, sensorType)
  );

  const prefix = getSensorPrefix(sensorType);
  const unit = SENSOR_UNITS[sensorType];

  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
  const [fromTime, setFromTime] = React.useState<string>("00:00");
  const [toTime, setToTime] = React.useState<string>("23:59");
  const [visibleSensors, setVisibleSensors] = React.useState<
    Record<string, boolean>
  >({
    [`sensor-${prefix}-1`]: true,
    [`sensor-${prefix}-2`]: true,
    [`sensor-${prefix}-3`]: true,
    [`sensor-${prefix}-4`]: true,
  });

  // Zbierz wszystkie pomiary ze wszystkich sensorów
  const getAllMeasurements = () => {
    const allMeasurements: Array<Measurement & { sensorId: string }> = [];

    Object.entries(sensors).forEach(([sensorId, sensor]) => {
      sensor.data.forEach((measurement: Measurement) => {
        allMeasurements.push({ ...measurement, sensorId });
      });
    });

    return allMeasurements;
  };

  // Filtruj dane po zakresie dat z godzinami
  const filterByDateRange = (
    data: Array<Measurement & { sensorId: string }>
  ) => {
    if (!dateRange?.from) {
      return data;
    }

    return data.filter((measurement) => {
      const rowDate = new Date(measurement.timestamp);
      const fromDate = dateRange.from;
      const toDate = dateRange.to || dateRange.from;

      if (!fromDate || !toDate) return true;

      const from = new Date(fromDate);
      const to = new Date(toDate);

      const [fromHour, fromMinute] = fromTime.split(":").map(Number);
      const [toHour, toMinute] = toTime.split(":").map(Number);

      from.setHours(fromHour, fromMinute, 0, 0);
      to.setHours(toHour, toMinute, 59, 999);

      return rowDate >= from && rowDate <= to;
    });
  };

  const allMeasurements = getAllMeasurements();
  const filteredMeasurements = filterByDateRange(allMeasurements);

  // Przygotuj dane dla wykresu ze wszystkimi sensorami - grupuj do sekundy
  const prepareAllSensorsChartData = () => {
    // Grupuj pomiary według timestamp zaokrąglonego do sekundy
    const groupedByTime = new Map<string, any>();

    filteredMeasurements.forEach((measurement) => {
      const date = new Date(measurement.timestamp);
      // Zaokrąglij do sekundy (usuń milisekundy)
      date.setMilliseconds(0);
      const timeKey = date.toISOString();

      if (!groupedByTime.has(timeKey)) {
        groupedByTime.set(timeKey, {
          timestamp: format(date, "dd/MM HH:mm:ss", { locale: pl }),
          fullTimestamp: timeKey,
        });
      }

      const entry = groupedByTime.get(timeKey);
      entry[measurement.sensorId] = measurement.value;
    });

    // Sortuj po dacie
    return Array.from(groupedByTime.values()).sort(
      (a, b) =>
        new Date(a.fullTimestamp).getTime() -
        new Date(b.fullTimestamp).getTime()
    );
  };

  // Przygotuj dane dla wykresu pojedynczego sensora - grupuj do sekundy
  const prepareSingleSensorChartData = (sensorId: string) => {
    const sensorData = (sensors as any)[sensorId]?.data || [];
    const filtered = filterByDateRange(
      sensorData.map((m: Measurement) => ({ ...m, sensorId }))
    );

    const sortedData = [...filtered].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return sortedData.map((measurement) => {
      const date = new Date(measurement.timestamp);
      // Zaokrąglij do sekundy (usuń milisekundy)
      date.setMilliseconds(0);
      return {
        timestamp: format(date, "dd/MM HH:mm:ss", { locale: pl }),
        fullTimestamp: date.toISOString(),
        value: measurement.value,
      };
    });
  };

  // Konfiguracja wykresu dla wszystkich sensorów - po jednej linii na sensor
  const sensorColors = colorChartMap[sensorType];
  const allSensorsChartConfig = {
    [`sensor-${prefix}-1`]: {
      label: `Sensor 1`,
      color: sensorColors[0],
    },
    [`sensor-${prefix}-2`]: {
      label: `Sensor 2`,
      color: sensorColors[1],
    },
    [`sensor-${prefix}-3`]: {
      label: `Sensor 3`,
      color: sensorColors[2],
    },
    [`sensor-${prefix}-4`]: {
      label: `Sensor 4`,
      color: sensorColors[3],
    },
    average: {
      label: `Średnia`,
      color: "#6b7280",
    },
  } satisfies ChartConfig;

  // Konfiguracja wykresu dla pojedynczego sensora

  const allSensorsChartData = prepareAllSensorsChartData();

  // Dodaj wartości średnie do danych wykresu
  const allSensorsChartDataWithAverage = allSensorsChartData.map((dataPoint) => {
    const values: number[] = [];
    [1, 2, 3, 4].forEach((sensorNum) => {
      const sensorId = `sensor-${prefix}-${sensorNum}`;
      if (dataPoint[sensorId] !== undefined) {
        values.push(dataPoint[sensorId]);
      }
    });
    const average = values.length > 0 
      ? values.reduce((sum, val) => sum + val, 0) / values.length 
      : undefined;
    return { ...dataPoint, average };
  });

  const [showAverage, setShowAverage] = React.useState(false);

  const toggleSensor = (sensorId: string) => {
    setVisibleSensors((prev) => ({
      ...prev,
      [sensorId]: !prev[sensorId],
    }));
  };

  return (
    <div>
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-200">
          <TabsTrigger className="px-6" value="all">
            Wszystkie ({filteredMeasurements.length})
          </TabsTrigger>
          {[1, 2, 3, 4].map((sensorNum) => {
            const sensorId = `sensor-${prefix}-${sensorNum}`;
            const sensorData = (sensors as any)[sensorId]?.data || [];
            const filtered = filterByDateRange(
              sensorData.map((m: Measurement) => ({ ...m, sensorId }))
            );
            return (
              <TabsTrigger key={sensorNum} className="px-6" value={sensorId}>
                Sensor {sensorNum} ({filtered.length})
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Wykres wszystkich pomiarów */}
        <TabsContent value="all" className="mt-4">
          <div className="mb-4 gap-2 flex items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd MMM yyyy", { locale: pl })}{" "}
                        - {format(dateRange.to, "dd MMM yyyy", { locale: pl })}
                      </>
                    ) : (
                      format(dateRange.from, "dd MMM yyyy", { locale: pl })
                    )
                  ) : (
                    <span>Wybierz zakres dat</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  locale={pl}
                />
                <div className="p-3 border-t space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 space-y-1">
                      <label className="text-sm font-medium">Od godziny</label>
                      <Input
                        type="time"
                        value={fromTime}
                        onChange={(e) => setFromTime(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-sm font-medium">Do godziny</label>
                      <Input
                        type="time"
                        value={toTime}
                        onChange={(e) => setToTime(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                  {dateRange && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setDateRange(undefined);
                        setFromTime("00:00");
                        setToTime("23:59");
                      }}
                    >
                      Wyczyść filtr
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 4].map((sensorNum) => {
                const sensorId = `sensor-${prefix}-${sensorNum}`;
                const isVisible = visibleSensors[sensorId];
                return (
                  <Button
                    key={sensorId}
                    variant={isVisible ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleSensor(sensorId)}
                    style={
                      isVisible
                        ? {
                            backgroundColor: sensorColors[sensorNum - 1],
                            borderColor: sensorColors[sensorNum - 1],
                          }
                        : {}
                    }
                  >
                    Sensor {sensorNum}
                  </Button>
                );
              })}
              <Button
                variant={showAverage ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAverage(!showAverage)}
                style={
                  showAverage
                    ? {
                        backgroundColor: "#6b7280",
                        borderColor: "#6b7280",
                      }
                    : {}
                }
              >
                Średnia
              </Button>
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Wykres wszystkich sensorów</CardTitle>
              <CardDescription>
                Pokazuje pomiary ze wszystkich 4 sensorów typu{" "}
                {SENSOR_NAMES[sensorType]}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {allSensorsChartDataWithAverage.length > 0 ? (
                <ChartContainer config={allSensorsChartConfig}>
                  <LineChart
                    data={allSensorsChartDataWithAverage}
                    margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="timestamp"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      minTickGap={32}
                    />
                    <YAxis />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          className="w-[200px]"
                          labelFormatter={(value) => {
                            const item = allSensorsChartData.find(
                              (d) => d.timestamp === value
                            );
                            return item
                              ? format(new Date(item.fullTimestamp), "PPpp", {
                                  locale: pl,
                                })
                              : value;
                          }}
                        />
                      }
                    />
                    {[1, 2, 3, 4].map((sensorNum) => {
                      const sensorId = `sensor-${prefix}-${sensorNum}`;
                      if (!visibleSensors[sensorId]) return null;
                      return (
                        <Line
                          key={sensorId}
                          type="monotone"
                          dataKey={sensorId}
                          stroke={sensorColors[sensorNum - 1]}
                          strokeWidth={2}
                          dot={false}
                          name={`Sensor ${sensorNum}`}
                          connectNulls={true}
                        />
                      );
                    })}
                    {showAverage && (
                      <Line
                        type="monotone"
                        dataKey="average"
                        stroke="#6b7280"
                        strokeWidth={3}
                        strokeDasharray="5 5"
                        dot={false}
                        name="Średnia"
                        connectNulls={true}
                      />
                    )}
                  </LineChart>
                </ChartContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  Brak danych do wyświetlenia
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Wykresy dla każdego sensora osobno */}
        {[1, 2, 3, 4].map((sensorNum) => {
          const sensorId = `sensor-${prefix}-${sensorNum}`;
          const chartData = prepareSingleSensorChartData(sensorId);

          // Oblicz średnią dla pojedynczego sensora
          const sensorAverage = chartData.length > 0
            ? chartData.reduce((sum, d) => sum + d.value, 0) / chartData.length
            : 0;

          const chartDataWithAverage = chartData.map(d => ({
            ...d,
            average: sensorAverage,
          }));

          const singleSensorChartConfig = {
            value: {
              label: `Wartość (${unit})`,
              color: sensorColors[sensorNum - 1],
            },
            average: {
              label: `Średnia (${sensorAverage.toFixed(2)} ${unit})`,
              color: "#6b7280",
            },
          } satisfies ChartConfig;

          return (
            <TabsContent key={sensorId} value={sensorId} className="mt-4">
              <div className="mb-4 gap-2 flex items-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "dd MMM yyyy", {
                              locale: pl,
                            })}{" "}
                            -{" "}
                            {format(dateRange.to, "dd MMM yyyy", {
                              locale: pl,
                            })}
                          </>
                        ) : (
                          format(dateRange.from, "dd MMM yyyy", { locale: pl })
                        )
                      ) : (
                        <span>Wybierz zakres dat</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      locale={pl}
                    />
                    <div className="p-3 border-t space-y-3">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 space-y-1">
                          <label className="text-sm font-medium">
                            Od godziny
                          </label>
                          <Input
                            type="time"
                            value={fromTime}
                            onChange={(e) => setFromTime(e.target.value)}
                            className="w-full"
                          />
                        </div>
                        <div className="flex-1 space-y-1">
                          <label className="text-sm font-medium">
                            Do godziny
                          </label>
                          <Input
                            type="time"
                            value={toTime}
                            onChange={(e) => setToTime(e.target.value)}
                            className="w-full"
                          />
                        </div>
                      </div>
                      {dateRange && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            setDateRange(undefined);
                            setFromTime("00:00");
                            setToTime("23:59");
                          }}
                        >
                          Wyczyść filtr
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Sensor {sensorNum}</CardTitle>
                  <CardDescription>
                    Pomiary z sensora {sensorId}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {chartData.length > 0 ? (
                    <ChartContainer config={singleSensorChartConfig}>
                      <LineChart
                        data={chartDataWithAverage}
                        margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="timestamp"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          minTickGap={32}
                        />
                        <YAxis />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              className="w-[200px]"
                              labelFormatter={(value) => {
                                const item = chartData.find(
                                  (d) => d.timestamp === value
                                );
                                return item
                                  ? format(
                                      new Date(item.fullTimestamp),
                                      "PPpp",
                                      { locale: pl }
                                    )
                                  : value;
                              }}
                            />
                          }
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke={sensorColors[sensorNum - 1]}
                          strokeWidth={2}
                          dot={false}
                          connectNulls={true}
                        />
                        <Line
                          type="monotone"
                          dataKey="average"
                          stroke="#6b7280"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                          name="Średnia"
                        />
                      </LineChart>
                    </ChartContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      Brak danych do wyświetlenia
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default ChartComponent;
