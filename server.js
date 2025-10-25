
// server.js
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

// Serve static files (dashboard, css, js)
app.use(express.static(path.join(__dirname, "public")));

// Default route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// Socket.io logic (live multiplier simulation)
let multiplier = 1.0;
let crashPoint = 0;
let inRound = false;

function startRound() {
  multiplier = 1.0;
  crashPoint = (Math.random() * 10 + 1).toFixed(2); // random 1x–11x
  inRound = true;
  io.emit("roundStart", { crashPoint });
  console.log(`🛫 Round started. Crash at ${crashPoint}x`);

  const interval = setInterval(() => {
    if (!inRound) return clearInterval(interval);

    multiplier += 0.05;
    io.emit("multiplierUpdate", { multiplier: multiplier.toFixed(2) });

    if (multiplier >= crashPoint) {
      io.emit("roundEnd", { crashPoint });
      console.log(`💥 Crashed at ${crashPoint}x`);
      inRound = false;
      setTimeout(startRound, 3000); // start next round after 3s
      clearInterval(interval);
    }
  }, 200);
}

io.on("connection", (socket) => {
  console.log("👤 Player connected");
  socket.emit("status", "Connected to Aviator Live Server");
});

startRound();

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`🚀 FlyWithObed Aviator API running on port ${PORT}`);
});
