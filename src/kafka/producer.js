import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "battery-producer",
  brokers: ["localhost:9092"],
});

const producer = kafka.producer();

export async function connectProducer() {
  await producer.connect();
  console.log("Kafka Producer connected");
}

export async function sendBatteryData(data) {
  await producer.send({
    topic: "batterydetails",
    messages: [{ value: JSON.stringify(data) }],
  });
  console.log("Sent to Kafka:", data);
}

function generateDummyBatteryData() {
  return {
    batteryId: Math.floor(Math.random() * 1000),
    voltage: parseFloat((Math.random() * 10 + 10).toFixed(2)), // 10V to 20V
    temperature: parseFloat((Math.random() * 40 + 20).toFixed(2)), // 20°C to 60°C
    chargePercentage: Math.floor(Math.random() * 100),
    timestamp: new Date().toISOString(),
  };
}

// Function to periodically send 5 dummy messages at once
export function startDummyDataProducer(interval = 1000) {
  setInterval(async () => {
    const messages = [];
    for (let i = 0; i < 5; i++) {
      messages.push({ value: JSON.stringify(generateDummyBatteryData()) });
    }
    await producer.send({
      topic: "batterydetails",
      messages,
    });
    console.log("Sent 5 messages to Kafka at once");
  }, interval);
}
