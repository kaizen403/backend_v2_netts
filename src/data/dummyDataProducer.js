import { connectProducer, sendBatteryData } from "../kafka/producer.js";

function generateDummyBatteryData() {
  return {
    batteryId: Math.floor(Math.random() * 1000),
    voltage: parseFloat((Math.random() * 10 + 10).toFixed(2)), // Random voltage between 10 and 20
    temperature: parseFloat((Math.random() * 40 + 20).toFixed(2)), // Random temperature between 20 and 60
    chargePercentage: Math.floor(Math.random() * 100),
    timestamp: new Date().toISOString(),
  };
}

async function startDummyProducer() {
  await connectProducer();
  setInterval(async () => {
    const data = generateDummyBatteryData();
    await sendBatteryData(data);
  }, 5000); // Adjust interval as needed
}

startDummyProducer();
