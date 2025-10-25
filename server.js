
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

const PORT = process.env.PORT || 10000;

let currentMultiplier = 1.0;
let gameRunning = false;
let crashPoint = 2.0 + Math.random() * 10;
let history = [];

function startRound() {
  gameRunning = true;
  currentMultiplier = 1.0;
  crashPoint = 1.2 + Math.random() * 10;
  console.log(`🛫 Round started. Crash at ${crashPoint.toFixed(2)}x`);
  io.emit("roundStarted");

  const interval = setInterval(() => {
    if (currentMultiplier >= crashPoint) {
      clearInterval(interval);
      io.emit("roundCrashed", crashPoint.toFixed(2));
      console.log(`💥 Crashed at ${crashPoint.toFixed(2)}x`);
      history.unshift({ crash: crashPoint.toFixed(2) });
      if (history.length > 10) history.pop();

      setTimeout(startRound, 3000);
      gameRunning = false;
    } else {
      currentMultiplier += 0.05;
      io.emit("multiplierUpdate", currentMultiplier.toFixed(2));
    }
  }, 100);
}

io.on("connection", (socket) => {
  console.log("🧑‍✈️ Player connected");
  socket.emit("history", history);
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  startRound();
});
