
// server.js
import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let round = 2000;
let target = 0;
let multiplier = 1;
let running = false;

// Serve frontend (index.html)
app.use(express.static(path.join(__dirname, "public")));

server.listen(10000, () => {
  console.log("🚀 FlyWithObed Aviator Live Server running on port 10000");
  console.log("✅ Server listening at https://flywithobed-livebet.onrender.com");
  startRound();
});

function startRound() {
  running = true;
  round++;
  multiplier = 1;
  target = (Math.random() * 8 + 1).toFixed(2);
  console.log(`🟢 Round ${round} started (target ${target}x)`);

  broadcast({ round, target, message: `Round ${round} started` });

  const interval = setInterval(() => {
    if (multiplier >= target) {
      clearInterval(interval);
      crash(multiplier);
    } else {
      multiplier += 0.05;
      broadcast({ multiplier });
    }
  }, 200);
}

function crash(point) {
  console.log(`💥 Crashed at ${point.toFixed(2)}x`);
  broadcast({ round, crashPoint: point });
  running = false;

  setTimeout(startRound, 3000);
}

function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(JSON.stringify(data));
  });
}

wss.on("connection", (ws) => {
  console.log("🟢 New client connected");
  ws.send(JSON.stringify({ message: "✅ FlyWithObed Aviator API is live and running!" }));
});
