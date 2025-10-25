
// ✅ FlyWithObed Aviator API Server
import express from "express";
import { WebSocketServer } from "ws";

const app = express();
const PORT = process.env.PORT || 10000;

// Serve dashboard frontend
app.use(express.static("."));

app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/index.html");
});

// Create WebSocket server
const server = app.listen(PORT, () => {
  console.log(`✅ FlyWithObed Aviator API is live and running on port ${PORT}!`);
});

const wss = new WebSocketServer({ server });

// Game state
let round = 1;
let multiplier = 1.0;
let flying = false;

function startRound() {
  if (flying) return;
  flying = true;
  multiplier = 1.0;

  const interval = setInterval(() => {
    multiplier += Math.random() * 0.2; // plane rises gradually
    broadcast({ type: "multiplier", value: multiplier });

    if (multiplier >= 10 || Math.random() < 0.02) {
      clearInterval(interval);
      flying = false;
      const crash = multiplier;
      broadcast({ type: "crash", value: crash, round });
      round++;
      setTimeout(startRound, 4000); // wait 4s before next round
    }
  }, 500);
}

function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(data));
    }
  });
}

wss.on("connection", (ws) => {
  console.log("🟢 New dashboard connected");
  ws.send(JSON.stringify({ type: "status", message: "Connected to FlyWithObed API" }));
  if (!flying) startRound();
});

startRound();
