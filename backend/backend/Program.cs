using MQTTnet;
using MQTTnet.Client;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Driver;
using System.Globalization;
using System.Net.Mime;
using System.Text;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();


// --------------------- MONGO SETUP ---------------------

var mongoClient = new MongoClient("mongodb://mongo:27017");
var database = mongoClient.GetDatabase("iot_data");
var collection = database.GetCollection<Measurement>("measurements");


// --------------------- MQTT SETUP ---------------------

var factory = new MqttFactory();
var mqttClient = factory.CreateMqttClient();

var options = new MqttClientOptionsBuilder()
    .WithTcpServer("mqtt", 1883) // adres kontenera z brokerem
    .Build();


// --------------------- MQTT MESSAGE HANDLER ---------------------

mqttClient.ApplicationMessageReceivedAsync += async e =>
{
    try
    {
        string topic = e.ApplicationMessage.Topic;
        string payload = e.ApplicationMessage.ConvertPayloadToString();

        Console.WriteLine($"Received message: {topic} -> {payload}");

        var data = JsonSerializer.Deserialize<SensorData>(payload);

        if (data == null)
        {
            Console.WriteLine("Data was not deserialized.");
            return;
        }

        // Twoje przetwarzanie danych
        var modified = DataProcessor.DataModify(data);

        var document = new Measurement
        {
            DataType = modified.data_type,
            SensorId = modified.sensor_id,
            Value = modified.value,
            SourceTimestamp = modified.timestamp,
            SavedAt = DateTime.UtcNow
        };

        await collection.InsertOneAsync(document);

        Console.WriteLine("Saved to MongoDB.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error while processing message: {ex.Message}");
    }
};


// --------------------- MQTT CONNECT + SUBSCRIBE ---------------------

Console.WriteLine("Connecting to MQTT broker...");
await mqttClient.ConnectAsync(options);
await mqttClient.SubscribeAsync("sensors/#");
Console.WriteLine("MQTT connected & subscribed.");


// --------------------- REST API – ENDPOINTY ---------------------

app.MapGet("/", () => "MQTT backend works — data saved in MongoDB.");


// 1) Pobieranie danych z filtrowaniem i sortowaniem + eksport CSV/JSON
app.MapGet("/measurements", async (HttpRequest request) =>
{
    var q = request.Query;

    string? dataType = q["dataType"].FirstOrDefault();
    string[] sensors = ParseCsv(q["sensors"].FirstOrDefault());
    string sortBy = q["sortBy"].FirstOrDefault() ?? "sourceTimestamp";
    string sortDir = q["sortDir"].FirstOrDefault() ?? "desc";

    int page = int.TryParse(q["page"], out var p) ? p : 1;
    int pageSize = int.TryParse(q["pageSize"], out var ps) ? ps : 100;

    string? format = q["format"].FirstOrDefault();

    var filterList = new List<FilterDefinition<Measurement>>();
    var fb = Builders<Measurement>.Filter;

    if (!string.IsNullOrWhiteSpace(dataType))
        filterList.Add(fb.Eq(m => m.DataType, dataType));

    if (sensors.Length > 0)
        filterList.Add(fb.In(m => m.SensorId, sensors));

    var filter = filterList.Count > 0 ? fb.And(filterList) : fb.Empty;

    var sort = sortDir.ToLower() == "asc"
        ? Builders<Measurement>.Sort.Ascending(sortBy)
        : Builders<Measurement>.Sort.Descending(sortBy);

    var results = await collection
        .Find(filter)
        .Sort(sort)
        .Skip((page - 1) * pageSize)
        .Limit(pageSize)
        .ToListAsync();

    // CSV
    if (format == "csv")
    {
        Console.WriteLine("csv");
        var csv = ToCsv(results);
        return Results.File(Encoding.UTF8.GetBytes(csv), "text/csv", "measurements.csv");
    }

    // JSON download
    if (format == "json")
    {
        Console.WriteLine("json");
        var json = JsonSerializer.Serialize(results, new JsonSerializerOptions { WriteIndented = true });
        return Results.File(Encoding.UTF8.GetBytes(json), "application/json", "measurements.json");
    }

    return Results.Ok(results);
});

app.MapGet("/test", () => "OK TEST");

foreach (var ep in app.Services.GetRequiredService<EndpointDataSource>().Endpoints)
{
    Console.WriteLine(ep.DisplayName);
}

// --------------------- HELPERY ---------------------

static string[] ParseCsv(string? raw) =>
    string.IsNullOrWhiteSpace(raw)
        ? Array.Empty<string>()
        : raw.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);

static string ToCsv(IEnumerable<Measurement> list)
{
    var sb = new StringBuilder();
    sb.AppendLine("Id,DataType,SensorId,Value,SourceTimestamp,SavedAt");

    foreach (var m in list)
    {
        sb.AppendLine($"{m.Id},{m.DataType},{m.SensorId},{m.Value.ToString(CultureInfo.InvariantCulture)},{m.SourceTimestamp:o},{m.SavedAt:o}");
    }

    return sb.ToString();
}


// --------------------- RUN ---------------------

app.Run();

public class Measurement
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("data_type")]
    public string DataType { get; set; } = string.Empty;

    [BsonElement("sensor_id")]
    public string SensorId { get; set; } = string.Empty;

    [BsonElement("value")]
    public double Value { get; set; }

    [BsonElement("source_timestamp")]
    public DateTime SourceTimestamp { get; set; }

    [BsonElement("timestamp")]
    public DateTime SavedAt { get; set; }
}

