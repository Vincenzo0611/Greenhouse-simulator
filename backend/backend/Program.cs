using MQTTnet;
using MQTTnet.Client;
using MongoDB.Driver;
using MongoDB.Bson;
using System.Text.Json;

var mongoClient = new MongoClient("mongodb://mongo:27017");
var database = mongoClient.GetDatabase("iot_data");
var collection = database.GetCollection<BsonDocument>("measurements");

var factory = new MqttFactory();
var mqttClient = factory.CreateMqttClient();

var options = new MqttClientOptionsBuilder()
    .WithTcpServer("mqtt", 1883)
    .Build();

mqttClient.ApplicationMessageReceivedAsync += async e =>
{
    try
    {
        string topic = e.ApplicationMessage.Topic;
        string payload = e.ApplicationMessage.ConvertPayloadToString();

        Console.WriteLine($"Recieved message: {topic} -> {payload}");

        var data = JsonSerializer.Deserialize<SensorData>(payload);

        if (data == null)
        {
            Console.WriteLine("Data was not deserialized");
            return;
        }

        var modifiedData = DataProcessor.DataModify(data);

        var document = new BsonDocument
        {
            { "timestamp", DateTime.UtcNow },
            { "sensor_id", modifiedData.sensor_id },
            { "value", modifiedData.value },
            { "source_timestamp", modifiedData.timestamp }
        };

        await collection.InsertOneAsync(document);
        Console.WriteLine("Data was saved in MongoDB");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"That was an error during message: {ex.Message}");
    }
};


Console.WriteLine("Connecting with brocker MQTT...");
await mqttClient.ConnectAsync(options);
await mqttClient.SubscribeAsync("sensors/#");
Console.WriteLine("Connected with MQTT and started the subscription of topics");

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/", () => "MQTT backend works — data saved in MongoDB.");

app.Run();
