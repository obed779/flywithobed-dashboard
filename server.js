
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

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

let crashPoint = 1.0;
setInterval(() => {
  crashPoint = (Math.random() * 10 + 1).toFixed(2);
  io.emit("multiplier", crashPoint);
  console.log(`🛫 Round started at ${crashPoint}x`);
}, 5000);

io.on("connection", (socket) => {
  console.log("🧑‍✈️ Player connected", socket.id);
  socket.emit("multiplier", crashPoint);
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
