
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

// ✅ Serve the public folder (make sure /public/dashboard.html exists)
app.use(express.static(path.join(__dirname, "public")));

// ✅ Serve the dashboard HTML
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// ===============================
// 🛩️ AVIATOR GAME LOGIC
// ===============================

let round = 1;
let multiplier = 1.0;
let target = getRandomTarget();
let inProgress = false;

function getRandomTarget() {
  return (Math.random() * 9 + 1).toFixed(2); // random between 1x and 10x
}

function startRound() {
  multiplier = 1.0;
  target = getRandomTarget();
  inProgress = true;
  io.emit("roundStart", { round, target });
  console.log(`🟢 Round ${round} started (target ${target}x)`);

  const interval = setInterval(() => {
    if (!inProgress) {
      clearInterval(interval);
      return;
    }

    multiplier = (parseFloat(multiplier) + 0.05).toFixed(2);
    io.emit("multiplierUpdate", { multiplier });

    if (parseFloat(multiplier) >= parseFloat(target)) {
      inProgress = false;
      console.log(`💥 Round ${round} crashed at ${multiplier}x`);
      io.emit("roundCrash", { round, crashPoint: multiplier });
      round++;
      setTimeout(startRound, 3000); // 3 seconds before next round
    }
  }, 200);
}

// ✅ Start the first round automatically
startRound();

// ===============================
// 🌐 WEBSOCKET HANDLING
// ===============================
io.on("connection", (socket) => {
  console.log("🧑‍✈️ New dashboard connected");

  // Send current state to new connection
  socket.emit("init", {
    round,
    multiplier,
    target,
    inProgress,
  });

  socket.on("disconnect", () => {
    console.log("👋 Dashboard disconnected");
  });
});

// ===============================
// 🚀 START SERVER
// ===============================
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
