
// server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.static("public")); // ✅ serves dashboard.html and assets from /public

// Root route
app.get("/", (req, res) => {
  res.send("✅ FlyWithObed Aviator Game API is live and running!");
});

// ======================
// 🎮 Aviator Game Engine
// ======================
let multiplier = 1.0;
let inFlight = false;
let crashPoint = null;
let history = [];

// Random crash generator
function generateCrashPoint() {
  const r = Math.random();
  const crash = Math.max(1.0, (1 / (1 - r)) * 0.99);
  return parseFloat(crash.toFixed(2));
}

function startRound() {
  inFlight = true;
  multiplier = 1.0;
  crashPoint = generateCrashPoint();
  io.emit("roundStart", { crashPoint });

  const interval = setInterval(() => {
    if (multiplier >= crashPoint) {
      clearInterval(interval);
      inFlight = false;
      io.emit("roundEnd", { crashPoint });
      history.unshift({ round: history.length + 1, crashPoint });
      if (history.length > 10) history.pop();

      setTimeout(startRound, 5000);
    } else {
      multiplier = parseFloat((multiplier + 0.01).toFixed(2));
      io.emit("multiplierUpdate", { multiplier });
    }
  }, 100);
}

// Start first round after 3 seconds
setTimeout(startRound, 3000);

// ======================
// 👨‍✈️ Player Connections
// ======================
io.on("connection", (socket) => {
  console.log("🧑‍✈️ Player connected:", socket.id);
  socket.emit("welcome", {
    message: "Welcome to FlyWithObed Aviator!",
    history,
  });

  socket.on("disconnect", () => {
    console.log("❌ Player disconnected:", socket.id);
  });
});

// ======================
// 🚀 Start Server
// ======================
server.listen(PORT, () => {
  console.log(`🚀 FlyWithObed Aviator API running on port ${PORT}`);
});
