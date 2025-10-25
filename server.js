
// ✅ FlyWithObed Aviator Game Server
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

// Serve static files (like dashboard.html)
app.use(express.static(path.join(__dirname, "public")));

// Default route
app.get("/", (req, res) => {
  res.send("✅ FlyWithObed Aviator Game API is live and running!");
});

// Game state
let crashPoint = 1.0;
let isFlying = false;

// Random crash generator
function getCrashPoint() {
  const r = Math.random();
  if (r < 0.01) return 100;
  return (1 / (1 - r)).toFixed(2);
}

function startRound() {
  crashPoint = parseFloat(getCrashPoint());
  isFlying = true;
  io.emit("roundStarted", { crashPoint });
  console.log(`🎮 New round started! Will crash at: ${crashPoint}`);

  let multiplier = 1.0;
  const flight = setInterval(() => {
    multiplier += 0.01;
    io.emit("multiplierUpdate", { multiplier: multiplier.toFixed(2) });

    if (multiplier >= crashPoint) {
      clearInterval(flight);
      io.emit("roundEnded", { crashPoint });
      console.log(`💥 Plane crashed at ${crashPoint}x`);
      isFlying = false;
      setTimeout(startRound, 5000);
    }
  }, 100);
}

io.on("connection", (socket) => {
  console.log("👨‍✈️ Player connected:", socket.id);
  socket.emit("status", {
    message: "✅ Connected to FlyWithObed Aviator Live!",
  });

  if (!isFlying) startRound();

  socket.on("disconnect", () => {
    console.log("🧑‍✈️ Player disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 FlyWithObed Aviator API running on port ${PORT}`);
});
