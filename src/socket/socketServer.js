import { Server } from "socket.io";

let ioInstance;

export function initSocketServer(server) {
  ioInstance = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  ioInstance.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  console.log("Socket.IO server initialized");
  return ioInstance;
}

export function broadcastBatteryData(data) {
  if (ioInstance) {
    ioInstance.emit("battery-data", data);
  }
}
