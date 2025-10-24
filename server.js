
// =======================
// ✈️ FlyWithObed Aviator Backend
// =======================

import express from "express";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Set up paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Serve static files (dashboard, CSS, etc.)
app.use(express.static(path.join(__dirname, "public")));

// ✅ Serve dashboard.html as the main page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// ✅ Create server and WebSocket
const server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

const wss = new WebSocketServer({ server });

// =======================
// 🛩️ Aviator Game Logic
// =======================

let round = 1;
let multiplier = 1.0;
let crashPoint = getRandomCrashPoint();

// Function to generate a random crash point
function getRandomCrashPoint() {
  // Random crash between 1.10x and 10.00x
  return parseFloat((Math.random() * 9 + 1.1).toFixed(2));
}

// Broadcast message to all connected clients
function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(data));
    }
  });
}

// Start a new round
function startRound() {
  multiplier = 1.0;
  crashPoint = getRandomCrashPoint();
  console.log(`🛫 Round ${round} started (crash at ${crashPoint}x)`);

  broadcast({ type: "roundStart", round });

  // Run multiplier loop
  const interval = setInterval(() => {
    multiplier = parseFloat((multiplier + 0.05).toFixed(2));

    if (multiplier >= crashPoint) {
      clearInterval(interval);
      broadcast({ type: "crash", crashPoint });
      console.log(`💥 Crashed at ${crashPoint}x`);

      // Start next round after short delay
      round++;
      setTimeout(startRound, 3000);
    } else {
      broadcast({ type: "multiplierUpdate", multiplier });
    }
  }, 200); // update every 200ms
}

// WebSocket connections
wss.on("connection", (ws) => {
  console.log("🧑‍💻 Player connected via WebSocket");

  ws.send(JSON.stringify({ type: "log", message: "Welcome to FlyWithObed Aviator Live!" }));
  ws.send(JSON.stringify({ type: "roundStart", round }));

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);

      if (data.action === "bet") {
        console.log(`🎯 Player ${data.player} placed a bet`);
        broadcast({ type: "log", message: `🎯 Player ${data.player} placed a bet` });
      }

      if (data.action === "cashout") {
        console.log(`💰 Player ${data.player} cashed out at ${multiplier}x`);
        broadcast({ type: "log", message: `💰 Player ${data.player} cashed out at ${multiplier}x` });
      }
    } catch (err) {
      console.error("Invalid message:", msg);
    }
  });
});

// ✅ Start the first round automatically
startRound();
