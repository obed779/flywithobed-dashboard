
// server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.static("public")); // Serve files like dashboard.html

const PORT = process.env.PORT || 10000;

// ============================
// Aviator Game Simulation Logic
// ============================
let currentMultiplier = 1.0;
let gameRunning = false;
let crashPoint = 0;

function startRound() {
  if (gameRunning) return;
  gameRunning = true;
  currentMultiplier = 1.0;
  crashPoint = (Math.random() * 10 + 1).toFixed(2);

  io.emit("roundStart");
  console.log("🎮 New round started! Will crash at:", crashPoint);

  const interval = setInterval(() => {
    if (currentMultiplier >= crashPoint) {
      clearInterval(interval);
      gameRunning = false;
      io.emit("roundEnd", { crashPoint });
      console.log(`💥 Round crashed at ${crashPoint}x`);
      setTimeout(startRound, 3000);
    } else {
      currentMultiplier += 0.01;
      io.emit("multiplierUpdate", { multiplier: currentMultiplier });
    }
  }, 100);
}

// Start first round automatically
startRound();

// WebSocket connection
io.on("connection", (socket) => {
  console.log("🟢 Player connected:", socket.id);
  socket.emit("status", "✅ FlyWithObed Aviator Game API is live and running!");
  socket.on("disconnect", () => console.log("🔴 Player disconnected:", socket.id));
});

// Default route (optional message)
app.get("/", (req, res) => {
  res.send("✅ FlyWithObed Aviator Game API is live and running!");
});

server.listen(PORT, () => {
  console.log(`🚀 FlyWithObed Aviator API running on port ${PORT}`);
});
