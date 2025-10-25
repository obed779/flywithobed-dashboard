
// server.js
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

const PORT = process.env.PORT || 10000;

app.use(express.static(path.join(__dirname, "public")));

let crashPoint = 1.00;
let roundActive = false;

// simulate aviator live multiplier
function startRound() {
  roundActive = true;
  crashPoint = (Math.random() * 10 + 1).toFixed(2);
  let current = 1.00;

  console.log(`🛫 Round started. Crash at ${crashPoint}x`);
  io.emit("roundStart", { crashPoint });

  const interval = setInterval(() => {
    current += 0.05;
    io.emit("multiplierUpdate", { multiplier: current.toFixed(2) });

    if (current >= crashPoint) {
      clearInterval(interval);
      roundActive = false;
      io.emit("crash", { crashPoint });
      console.log(`💥 Crashed at ${crashPoint}x`);
      setTimeout(startRound, 4000);
    }
  }, 200);
}

io.on("connection", (socket) => {
  console.log("👨‍✈️ Player connected:", socket.id);
  socket.emit("message", "✅ FlyWithObed Aviator Game API is live and running!");
  if (!roundActive) startRound();
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

