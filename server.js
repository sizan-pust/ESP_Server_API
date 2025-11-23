import express from "express";
import { WebSocketServer } from "ws";
import http from "http";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let esp32Socket = null;

wss.on("connection", (socket, req) => {
  console.log("WS client connected");

  socket.on("message", (message) => {
    console.log("Received:", message.toString());

    const data = JSON.parse(message.toString());

    if (data.deviceId === "ESP32_001") {
      esp32Socket = socket;
    }

    // Relay Flutter → ESP32
    if (data.action === "SET_LED" && esp32Socket) {
      esp32Socket.send(JSON.stringify({ cmd: data.value }));
    }
  });

  socket.on("close", () => {
    console.log("WS client disconnected");
    if (socket === esp32Socket) esp32Socket = null;
  });
});

app.get("/", (req, res) => {
  res.send("WebSocket server running.");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running on", PORT));
