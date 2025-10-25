
import express from "express";
import { WebSocketServer } from "ws";
import http from "http";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 10000;

let round = 2000;
let multiplier = 1.0;
let status = "🟢 Plane flying...";
let targetCrash = getRandomCrashPoint();

function getRandomCrashPoint() {
  // Random crash between 1.1x and 10x
  return (Math.random() * 8.9 + 1.1).toFixed(2);
}

// Serve frontend
app.use(express.static("."));
app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/index.html");
});

server.listen(PORT, () => {
  console.log(`🚀 FlyWithObed Aviator Live Server running on port ${PORT}`);
  console.log(`✅ Server listening at https://flywithobed-livebet.onrender.com`);
  console.log(`🟢 Round ${round} started (target ${targetCrash}x)`);
});

wss.on("connection", (ws) => {
  console.log("👨‍✈️ New dashboard connected!");
  ws.send(JSON.stringify({
    type: "status",
    round,
    multiplier: multiplier.toFixed(2),
    status
  }));
});

// Broadcast updates every 300ms
setInterval(() => {
  multiplier += 0.05;

  if (multiplier >= targetCrash) {
    status = `💥 Crashed at ${targetCrash}x`;
    broadcast({ type: "status", round, multiplier: targetCrash, status });

    // Restart after crash
    setTimeout(() => {
      round++;
      multiplier = 1.0;
      targetCrash = getRandomCrashPoint();
      status = `🟢 Round ${round} started (target ${targetCrash}x)`;
      broadcast({ type: "status", round, multiplier, status });
      console.log(status);
    }, 2000);
  } else {
    broadcast({ type: "status", round, multiplier: multiplier.toFixed(2), status });
  }
}, 300);

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(msg);
  });
}

