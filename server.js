
import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let crashPoint = 1.0;

// Serve all frontend files from /public
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Live Aviator simulation
setInterval(() => {
  crashPoint = (Math.random() * 10 + 1).toFixed(2);
  console.log(`🛫 Round started. Crash at ${crashPoint}x`);
  io.emit("multiplier", crashPoint);
}, 5000);

// Handle socket connections
io.on("connection", (socket) => {
  console.log("🧑‍✈️ Player connected:", socket.id);
  socket.emit("multiplier", crashPoint);

  socket.on("disconnect", () => {
    console.log("👋 Player disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
