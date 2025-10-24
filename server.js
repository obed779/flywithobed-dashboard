
// server.js
import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import cors from "cors";

const app = express();
app.use(cors());

// HTTP endpoint
app.get("/", (req, res) => {
  res.send("✅ Aviator Game API is live and running!");
});

// Create server + WebSocket
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Game state
let round = 1;
let inFlight = false;
let multiplier = 1.0;

// Helper: send to all connected clients
function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(msg);
    }
  });
}

// Start a new round
function startRound() {
  inFlight = true;
  multiplier = 1.0;
  const crashPoint = (Math.random() * 5 + 1.1).toFixed(2); // random 1.10x–6.10x

  console.log(`🛫 Round ${round} started (crash at ${crashPoint}x)`);
  broadcast({ type: "roundStart", round, crashPoint });

  const interval = setInterval(() => {
    if (!inFlight) {
      clearInterval(interval);
      return;
    }

    // Keep multiplier numeric to prevent crash
    multiplier = parseFloat((multiplier + 0.05).toFixed(2));
    broadcast({ type: "multiplierUpdate", multiplier });

    // Crash condition
    if (multiplier >= parseFloat(crashPoint)) {
      inFlight = false;
      clearInterval(interval);
      console.log(`💥 Crashed at ${crashPoint}x`);
      broadcast({ type: "crash", round, crashPoint });

      // Start next round after short delay
      round++;
      setTimeout(startRound, 3000);
    }
  }, 200); // updates every 200ms
}

// WebSocket handling
wss.on("connection", (ws) => {
  console.log("🟢 Dashboard connected");
  ws.send(JSON.stringify({ type: "connected", message: "Welcome to FlyWithObed Aviator!" }));

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      if (data.action === "bet") {
        broadcast({ type: "log", message: `🎯 Player ${data.player} placed a bet` });
      } else if (data.action === "cashout") {
        broadcast({ type: "log", message: `💰 Player ${data.player} cashed out` });
      }
    } catch (err) {
      console.error("Invalid message:", err);
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  startRound(); // start first round automatically
});
