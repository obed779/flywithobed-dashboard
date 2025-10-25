
import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

// Fix for ES module paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 10000;

// ✅ Serve all static files (like dashboard.html) from "public" folder
app.use(express.static(path.join(__dirname, "public")));

// ✅ Root route (API home)
app.get("/", (req, res) => {
  res.send("✅ FlyWithObed Aviator Game API is live and running!");
});

// ✅ Game simulation variables
let currentMultiplier = 1.0;
let isFlying = false;
let crashPoint = 0;

// Function to generate random crash point
const generateCrashPoint = () => {
  const r = Math.random();
  return Math.max(1.0, (1 / (1 - r)) * 0.9);
};

// Game loop
const startRound = () => {
  if (isFlying) return;
  isFlying = true;
  crashPoint = generateCrashPoint();
  currentMultiplier = 1.0;
  console.log(`🎮 New round started! Will crash at: ${crashPoint.toFixed(2)}x`);

  io.emit("roundStarted", { crashPoint });

  const interval = setInterval(() => {
    currentMultiplier += 0.01;
    io.emit("multiplierUpdate", { multiplier: currentMultiplier.toFixed(2) });

    if (currentMultiplier >= crashPoint) {
      clearInterval(interval);
      io.emit("roundEnded", { crashPoint: crashPoint.toFixed(2) });
      console.log(`💥 Round crashed at: ${crashPoint.toFixed(2)}x`);
      isFlying = false;
      setTimeout(startRound, 3000);
    }
  }, 100);
};

io.on("connection", (socket) => {
  console.log("🟢 Player connected:", socket.id);
  socket.emit("status", { message: "Welcome to FlyWithObed Aviator!" });

  socket.on("disconnect", () => {
    console.log("🔴 Player disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 FlyWithObed Aviator API running on port ${PORT}`);
  startRound();
});
