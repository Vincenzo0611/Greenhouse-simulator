import time
import random
import paho.mqtt.client as mqtt
import os
import json

def generate_temp(quantity_of_sensors, value=None):
    if value is not None:
        data = {
            "sensor_id": "sensor-tmp-1",
            "value": value,
            "timestamp": time.time()
        }
        client.publish("sensors/data", json.dumps(data))
        print("Wysłano:", data)
        return
    for k in range(4):
        data = {
            "sensor_id": f"sensor-tmp-{k+1}",
            "value": round(random.uniform(20.0, 25.0), 2),
            "timestamp": time.time()
        }
        client.publish("sensors/data", json.dumps(data))

def generate_humidity(quantity_of_sensors, value=None):
    if value is not None:
        data = {
            "sensor_id": "sensor-hum-1",
            "value": value,
            "timestamp": time.time()
        }
        client.publish("sensors/data", json.dumps(data))
        print("Wysłano:", data)
        return
    for k in range(4):
        data = {
            "sensor_id": f"sensor-hum-{k+1}",
            "value": round(random.uniform(45.0, 85.0), 2),
            "timestamp": time.time()
        }
        client.publish("sensors/data", json.dumps(data))

def generate_sun_intensity(quantity_of_sensors, value=None):
    if value is not None:
        data = {
            "sensor_id": "sensor-sun-1",
            "value": value,
            "timestamp": time.time()
        }
        client.publish("sensors/data", json.dumps(data))
        print("Wysłano:", data)
        return
    for k in range(4):
        data = {
            "sensor_id": f"sensor-sun-{k+1}",
            "value": round(random.uniform(0, 100000), 2),
            "timestamp": time.time()
        }
        client.publish("sensors/data", json.dumps(data))

def generate_co2(quantity_of_sensors, value=None):
    if value is not None:
        data = {
            "sensor_id": "sensor-co2-1",
            "value": value,
            "timestamp": time.time()
        }
        client.publish("sensors/data", json.dumps(data))
        print("Wysłano:", data)
        return
    for k in range(4):
        data = {
            "sensor_id": f"sensor-co2-{k+1}",
            "value": round(random.uniform(450, 1200), 2),
            "timestamp": time.time()
        }
        client.publish("sensors/data", json.dumps(data))
        print(data)


quantity_of_measurement = 2
mqtt_host = "mqtt"
mqtt_port = 1883

client = mqtt.Client()
client.connect(mqtt_host, mqtt_port, 60)

for i in range(quantity_of_measurement):
    generate_temp(4)
    generate_humidity(4)
    generate_sun_intensity(4)
    generate_co2(4)
    time.sleep(2)
