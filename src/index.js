import express from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import authRoutes from "./routes/auth.js";
import bookingRoutes from "./routes/booking.js";
import "./config/passport.js";
import adminRoutes from "./routes/adminRoutes.js";
dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
  }),
);
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  }),
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/api/auth", authRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/admin", adminRoutes);
// Commented out: WebSocket and Kafka initialization
// import { initSocketServer } from "./socket/socketServer.js";
// import { startConsumer } from "./kafka/consumer.js";
// import { connectProducer, sendBatteryData } from "./kafka/producer.js";
// const io = initSocketServer(server);
// startConsumer(io);
// (async () => {
//   await connectProducer();
// })();

// Root route
//app.get("/", (req, res) => {
//res.send("WebSocket API with Kafka and Authentication is running!");
//});

// Commented out: WebSocket event handling
// io.on("connection", (socket) => {
//   console.log(`Client connected: ${socket.id}`);

//   socket.on("request-battery-data", async (data) => {
//     console.log(`Received request from ${socket.id} to send battery data`);
//     await sendBatteryData(data);
//   });

//   socket.on("disconnect", () => {
//     console.log(`Client disconnected: ${socket.id}`);
//   });
// });

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
