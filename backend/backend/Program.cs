using MQTTnet;
using MQTTnet.Client;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Driver;
using System.Globalization;
using System.Net.Mime;
using System.Text;
using System.Text.Json;
using System.Numerics;

using System.Collections.Generic;
using Nethereum.Web3;
using Nethereum.Web3.Accounts;


var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// --------------------- BLOCKCHAIN SETUP ---------------------
string rpcUrl = "http://blockchain:8545";
string privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
string contractAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
string abi = File.ReadAllText("contracts/SensorToken.json");

var account = new Account(privateKey, 1337);
var web3 = new Web3(account, rpcUrl);
var contract = web3.Eth.GetContract(abi, contractAddress);
var rewardFn = contract.GetFunction("rewardSensor");
var balanceOfFn = contract.GetFunction("balanceOf");

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

        if (SensorWallets.Wallets.TryGetValue(modified.sensor_id, out string walletAddress))
        {
            var txHash = await rewardFn.SendTransactionAsync(account.Address, new object[] { walletAddress });
            Console.WriteLine($"Sensor {data.sensor_id} nagrodzony tokenem. TX: {txHash}");
        }
        else
        {
            Console.WriteLine($"Brak przypisanego portfela dla sensora {data.sensor_id}");
        }
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

app.MapGet("/sensors/rewards", async () =>
{
    var results = new List<object>();

    foreach (var kvp in SensorWallets.Wallets)
    {
        string sensorId = kvp.Key;
        string walletAddress = kvp.Value;

        var balance = await balanceOfFn.CallAsync<BigInteger>(walletAddress);

        results.Add(new
        {
            sensor = sensorId,
            wallet = walletAddress,
            balance = Web3.Convert.FromWei(balance)
        });
    }

    return Results.Ok(results);
});



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

