
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
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const PORT = process.env.PORT || 10000;

// Serve the dashboard and all static files
app.use(express.static(path.join(__dirname, "public")));

// API test route
app.get("/", (req, res) => {
  res.send("✅ FlyWithObed Aviator Game API is live and running!");
});

// 🛫 Game logic
let multiplier = 1.0;
let isFlying = false;
let crashPoint = 0;
let roundInterval;

function startNewRound() {
  isFlying = true;
  multiplier = 1.0;
  crashPoint = (Math.random() * 9 + 1).toFixed(2); // random 1.00x–10.00x
  io.emit("roundStart", { crashPoint });
  console.log(`🎮 New round started! Will crash at: ${crashPoint}`);

  roundInterval = setInterval(() => {
    if (multiplier >= crashPoint) {
      isFlying = false;
      clearInterval(roundInterval);
      io.emit("roundCrash", { multiplier });
      console.log(`💥 Crashed at ${multiplier}x`);
      setTimeout(startNewRound, 4000); // next round after 4s
    } else {
      multiplier += 0.05;
      io.emit("multiplierUpdate", { multiplier: multiplier.toFixed(2) });
    }
  }, 200);
}

// Start first round
startNewRound();

// 🧠 Socket events
io.on("connection", (socket) => {
  console.log(`👨‍✈️ Player connected: ${socket.id}`);
  socket.emit("connected", { message: "Welcome to FlyWithObed Aviator!" });

  // send current multiplier
  socket.emit("multiplierUpdate", { multiplier: multiplier.toFixed(2) });

  socket.on("disconnect", () => {
    console.log(`🧑‍✈️ Player disconnected: ${socket.id}`);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 FlyWithObed Aviator API running on port ${PORT}`);
});
