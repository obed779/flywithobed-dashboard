
// ✅ FlyWithObed Aviator Game Server (Final Working Version)
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

// Serve dashboard and other static files from /public
app.use(express.static(path.join(__dirname, "public")));

// API check route
app.get("/", (req, res) => {
  res.send("✅ FlyWithObed Aviator Game API is live and running!");
});

// --- GAME LOGIC ---
let multiplier = 1.0;
let isFlying = false;
let crashPoint = 0;
let roundInterval;

function startRound() {
  multiplier = 1.0;
  isFlying = true;
  crashPoint = (Math.random() * 9 + 1).toFixed(2); // 1.00x–10.00x random crash
  io.emit("roundStart", { crashPoint });
  console.log(`🛫 Round started. Crash at ${crashPoint}x`);

  roundInterval = setInterval(() => {
    if (multiplier >= crashPoint) {
      clearInterval(roundInterval);
      isFlying = false;
      io.emit("roundCrash", { multiplier });
      console.log(`💥 Crashed at ${multiplier.toFixed(2)}x`);
      setTimeout(startRound, 4000);
    } else {
      multiplier += 0.05;
      io.emit("multiplierUpdate", { multiplier: multiplier.toFixed(2) });
    }
  }, 200);
}

// Start first round
startRound();

// --- SOCKET CONNECTION ---
io.on("connection", (socket) => {
  console.log("👨‍✈️ Player connected:", socket.id);
  socket.emit("connected", { message: "Welcome to FlyWithObed Aviator!" });
  socket.emit("multiplierUpdate", { multiplier: multiplier.toFixed(2) });

  socket.on("disconnect", () => {
    console.log("🧑‍✈️ Player disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
