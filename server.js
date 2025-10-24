
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
let inFlight = false;
let multiplier = 1.0;

function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(data));
    }
  });
}

function startRound() {
  inFlight = true;
  multiplier = 1.0;
  const crashPoint = (Math.random() * 5 + 1.1).toFixed(2);

  broadcast({ type: "roundStart", round, crashPoint });
  console.log(`🛫 Round ${round} started (crash at ${crashPoint}x)`);

  const timer = setInterval(() => {
    if (!inFlight) {
      clearInterval(timer);
      return;
    }

    multiplier = (multiplier + 0.05).toFixed(2);
    broadcast({ type: "multiplierUpdate", multiplier });

    if (parseFloat(multiplier) >= crashPoint) {
      inFlight = false;
      clearInterval(timer);
      broadcast({ type: "crash", round, crashPoint });
      console.log(`💥 Crashed at ${crashPoint}x`);
      round++;
      setTimeout(startRound, 3000); // start next round after 3 seconds
    }
  }, 200);
}

wss.on("connection", (ws) => {
  console.log("🟢 Dashboard connected");
  ws.send(JSON.stringify({ type: "connected" }));
});

server.listen(3000, () => {
  console.log("✅ Server running on port 3000");
  startRound();
});
