
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
const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 10000;

// Serve static from root and /public (dashboard.html should be in public/)
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, "public")));

// Root route and explicit dashboard route
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/dashboard.html", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "dashboard.html"))
);

// --- Game state ---
let inRound = false;
let multiplier = 1.0;
let crashPoint = 1.0;
let history = []; // latest first, up to 20 rounds

// Generate realistic-ish crash points (keeps things varied)
function generateCrashPoint() {
  // mixture of many small crashes and occasional large ones
  const r = Math.random();
  if (r < 0.01) return parseFloat((Math.random() * 100 + 2).toFixed(2)); // rare huge
  if (r < 0.2) return parseFloat((1 + Math.random() * 3).toFixed(2)); // common small-medium
  return parseFloat((1 + Math.random() * 9).toFixed(2)); // medium-large
}

// Start a round (emits events to all clients)
function startRound() {
  if (inRound) return;
  inRound = true;
  multiplier = 1.0;
  crashPoint = generateCrashPoint();
  io.emit("roundStart", { crashPoint }); // clients can use this to show incoming crash point for debugging if desired
  // broadcast initial multiplier
  io.emit("multiplierUpdate", { multiplier: multiplier.toFixed(2) });

  const tickMs = 100; // update interval
  const step = 0.01; // multiplier step (increase)
  const timer = setInterval(() => {
    multiplier = parseFloat((multiplier + step).toFixed(4));
    io.emit("multiplierUpdate", { multiplier: multiplier.toFixed(2) });

    if (multiplier >= crashPoint) {
      // crash
      clearInterval(timer);
      inRound = false;
      const crashStr = crashPoint.toFixed(2);
      history.unshift({ crashPoint: crashStr, time: new Date().toISOString() });
      if (history.length > 20) history.pop();
      io.emit("roundEnd", { crashPoint: crashStr, history });
      // next round after short delay
      setTimeout(startRound, 4000);
    }
  }, tickMs);
}

// Start automatically if server starts and no round
setTimeout(startRound, 1500);

// --- Socket.IO connections ---
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // send welcome + current state
  socket.emit("welcome", {
    message: "Welcome to FlyWithObed",
    inRound,
    multiplier: multiplier.toFixed(2),
    crashPoint: crashPoint.toFixed(2),
    history
  });

  // if a client requests to start (optional)
  socket.on("requestStart", () => {
    if (!inRound) startRound();
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Health endpoint
app.get("/api/status", (req, res) =>
  res.json({ ok: true, message: "✅ FlyWithObed Aviator Game API is live and running!" })
);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 FlyWithObed Aviator API running on port ${PORT}`);
});



