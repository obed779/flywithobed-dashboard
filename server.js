
// server.js
import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import cors from "cors";

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("✅ Aviator Game API is live and running!");
});

const server = createServer(app);
const wss = new WebSocketServer({ server });

let round = 1;
let multiplier = 1.0;
let inFlight = false;

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(c => {
    if (c.readyState === 1) c.send(msg);
  });
}

function startRound() {
  inFlight = true;
  multiplier = 1.0;
  broadcast({ type: "round", round });
  broadcast({ type: "log", message: `🛫 Round ${round} started` });

  const flight = setInterval(() => {
    if (!inFlight) return clearInterval(flight);

    multiplier += 0.05;
    broadcast({ type: "multiplier", value: multiplier });

    const crashAt = Math.random() * 5 + 1.1; // random crash 1.1–6.1x
    if (multiplier >= crashAt) {
      inFlight = false;
      broadcast({ type: "crash", round, point: crashAt });
      broadcast({ type: "log", message: `💥 Crashed at ${crashAt.toFixed(2)}x` });
      round++;
      setTimeout(startRound, 3000);
      clearInterval(flight);
    }
  }, 200);
}

wss.on("connection", ws => {
  console.log("🟢 Client connected");
  ws.send(JSON.stringify({ type: "log", message: "Connected to FlyWithObed backend" }));

  ws.on("message", msg => {
    try {
      const data = JSON.parse(msg);
      if (data.action === "bet") {
        broadcast({ type: "log", message: `🎯 Player ${data.player} placed a bet` });
      } else if (data.action === "cashout") {
        broadcast({ type: "log", message: `💰 Player ${data.player} cashed out` });
      }
    } catch (e) {
      console.log("Invalid message", e);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  startRound(); // start the flight loop
});
