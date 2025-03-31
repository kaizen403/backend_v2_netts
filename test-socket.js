import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

socket.on("connect", () => {
  console.log("Connected: " + socket.id);
  // Emit a request to simulate a battery data request
  socket.emit("request-battery-data", {
    batteryId: 101,
    voltage: 12.5,
    temperature: 45,
    chargePercentage: 85,
    timestamp: new Date().toISOString(),
  });
});

socket.on("battery-data", (data) => {
  console.log("Received battery data:", data);
});

socket.on("disconnect", () => {
  console.log("Disconnected");
});
