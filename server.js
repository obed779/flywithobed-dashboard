
// server.js
import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Aviator simulation data
let round = 2045;
let multiplier = 1.0;
let inProgress = false;
let target = 0;
let history = [];

console.log(`🚀 FlyWithObed Aviator Live Server running on port ${PORT}`);

// Broadcast function to all clients
function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(msg);
  });
}

// Start a new round
function startRound() {
  inProgress = true;
  multiplier = 1.0;
  target = +(Math.random() * 9 + 1).toFixed(2);
  console.log(`🟢 Round ${round} started (target ${target}x)`);

  broadcast({ type: "update", multiplier, round });

  const interval = setInterval(() => {
    if (!inProgress) {
      clearInterval(interval);
      return;
    }

    multiplier += 0.05;

    if (multiplier >= target) {
      clearInterval(interval);
      crashPlane();
    } else {
      broadcast({ type: "update", multiplier, round });
    }
  }, 200);
}

// Crash function
function crashPlane() {
  inProgress = false;
  console.log(`💥 Crashed at ${multiplier.toFixed(2)}x`);
  history.unshift({ round, crashPoint: multiplier });
  broadcast({ type: "crash", round, crashPoint: multiplier });

  // Limit history to 20 entries
  if (history.length > 20) history.pop();

  setTimeout(() => {
    round++;
    startRound();
  }, 3000);
}

// WebSocket connection
wss.on("connection", (ws) => {
  console.log("🔗 New client connected");

  // Send current state
  ws.send(JSON.stringify({ type: "update", multiplier, round }));
  history.forEach((h) => ws.send(JSON.stringify({ type: "crash", ...h })));

  // Handle chat messages
  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.type === "chat") {
        broadcast({
          type: "chat",
          user: data.user || "Player",
          message: data.message,
        });
      }
    } catch (err) {
      console.error("❌ Error parsing message:", err);
    }
  });

  ws.on("close", () => {
    console.log("🔌 Client disconnected");
  });
});

// API test route
app.get("/", (req, res) => {
  res.send("✅ FlyWithObed Aviator API is live and running!");
});

// Start the first round automatically
startRound();

server.listen(PORT, () => {
  console.log(`✅ Server listening at https://flywithobed-livebet.onrender.com`);
});

  
