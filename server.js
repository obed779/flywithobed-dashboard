
// server.js
import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import cors from "cors";

const app = express();
app.use(cors());

// Simple HTTP route to verify the server is running
app.get("/", (req, res) => {
  res.send("✅ Aviator Game API is live and running!");
});

const server = createServer(app);
const wss = new WebSocketServer({ server });

// --- Game state ---
let round = 1;
let multiplier = 1.0;
let inFlight = false;

// Broadcast helper
function broadcast(data) {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(message);
  });
}

// Start a new game round
function startRound() {
  inFlight = true;
  multiplier = 1.0;
  broadcast({ type: "round", round });
  broadcast({ type: "log", message: `🛫 Round ${round} started.` });

  const flight = setInterval(() => {
    if (!inFlight) return clearInterval(flight);

    multiplier += 0.05;
    broadcast({ type: "multiplier", value: multiplier });

    // Random crash point
    const crashPoint = Math.random() * 5 + 1.1; // 1.1x – 6.1x
    if (multiplier >= crashPoint) {
      inFlight = false;
      broadcast({ type: "crash", round, point: crashPoint });
      broadcast({ type: "log", message: `💥 Crashed at ${crashPoint.toFixed(2)}x` });

      round++;
      setTimeout(startRound, 3000);
      clearInterval(flight);
    }
  }, 200);
}

// Handle player connections
wss.on("connection", (ws) => {
  console.log("🟢 Player connected");
  ws.send(JSON.stringify({ type: "log", message: "Connected to FlyWithObed Live backend!" }));

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.action === "bet") {
        broadcast({ type: "log", message: `🎯 Player ${data.player} placed a bet` });
      } else if (data.action === "cashout") {
        broadcast({ type: "log", message: `💰 Player ${data.player} cashed out` });
      }
    } catch {
      console.log("Invalid message received.");
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  startRound();
});
