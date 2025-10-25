
import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Express + HTTP + Socket.io
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Default route → dashboard
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// Aviator game state
let round = 2049;
let multiplier = 1.0;
let inProgress = false;
let crashPoint = 1.5;

// Game loop
function startRound() {
  round++;
  inProgress = true;
  crashPoint = (Math.random() * 10 + 1).toFixed(2);
  multiplier = 1.0;

  io.emit("roundStart", { round, crashPoint });

  const interval = setInterval(() => {
    multiplier = (multiplier + 0.05).toFixed(2);
    io.emit("multiplierUpdate", { multiplier });

    if (multiplier >= crashPoint) {
      clearInterval(interval);
      inProgress = false;
      io.emit("roundCrash", { round, crashPoint });
      setTimeout(startRound, 3000); // 3s before next round
    }
  }, 200);
}

// Socket.io connection
io.on("connection", (socket) => {
  console.log("🟢 New dashboard connected");
  socket.emit("status", "Connected to FlyWithObed Aviator Live API");
});

// Start game
startRound();

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
