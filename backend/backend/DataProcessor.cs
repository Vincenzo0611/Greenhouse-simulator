public static class DataProcessor
{
    public static ProcessedData DataModify(SensorData s)
    {
        string dataType = DetectType(s.sensor_id);

        return new ProcessedData
        {
            data_type = dataType,
            sensor_id = s.sensor_id,
            value = s.value,
            timestamp = DateTimeOffset.FromUnixTimeSeconds((long)Math.Floor(s.timestamp))
                        .AddMilliseconds((s.timestamp % 1) * 1000)
                        .UtcDateTime,
        };
    }

    private static string DetectType(string sensorId)
    {
        if (sensorId.StartsWith("sensor-tmp")) return "temperature";
        if (sensorId.StartsWith("sensor-hum")) return "humidity";
        if (sensorId.StartsWith("sensor-co2")) return "co2";
        if (sensorId.StartsWith("sensor-sun")) return "sunlight";

        return "unknown";
    }
}
