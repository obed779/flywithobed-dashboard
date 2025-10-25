
import express from "express";
import { WebSocketServer } from "ws";
import http from "http";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 10000;

let round = 2000;
let multiplier = 1.0;
let targetCrash = getRandomCrashPoint();
let flying = true;

function getRandomCrashPoint() {
  // Between 1.10x and 10.00x
  return (Math.random() * 8.9 + 1.1).toFixed(2);
}

// serve dashboard
app.use(express.static("."));
app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/index.html");
});

server.listen(PORT, () => {
  console.log(`🚀 FlyWithObed Aviator Live Server running on port ${PORT}`);
  console.log(`✅ Server listening at https://flywithobed-livebet.onrender.com`);
  console.log(`🟢 Round ${round} started (target ${targetCrash}x)`);
});

// when a dashboard connects
wss.on("connection", (ws) => {
  console.log("👨‍✈️ New dashboard connected!");
  ws.send(JSON.stringify({
    type: "status",
    round,
    multiplier: multiplier.toFixed(2),
    status: `🟢 Round ${round} started (target ${targetCrash}x)`
  }));
});

// update loop every 200ms
setInterval(() => {
  if (flying) {
    multiplier += 0.05;
    broadcast({
      type: "status",
      round,
      multiplier: multiplier.toFixed(2),
      status: `🛫 Flying... ${multiplier.toFixed(2)}x`
    });

    if (multiplier >= targetCrash) {
      flying = false;
      broadcast({
        type: "status",
        round,
        multiplier: targetCrash,
        status: `💥 Crashed at ${targetCrash}x`
      });

      setTimeout(() => {
        // restart new round
        round++;
        multiplier = 1.0;
        targetCrash = getRandomCrashPoint();
        flying = true;
        broadcast({
          type: "status",
          round,
          multiplier: multiplier.toFixed(2),
          status: `🟢 Round ${round} started (target ${targetCrash}x)`
        });
      }, 2000);
    }
  }
}, 200);

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(msg);
  });
}
