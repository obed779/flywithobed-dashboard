
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

let round = 0;
let clients = [];

app.use(express.static(__dirname)); // serves index.html + assets

// ✅ WebSocket connection
wss.on("connection", (ws) => {
  console.log("✅ Client connected to Aviator Live");
  clients.push(ws);

  ws.on("close", () => {
    clients = clients.filter((c) => c !== ws);
    console.log("❌ Client disconnected");
  });
});

// ✅ Helper to broadcast data to all connected clients
function broadcast(data) {
  clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(data));
    }
  });
}

// ✅ Start Aviator rounds
function startRound() {
  round++;
  const crashPoint = (Math.random() * 6 + 1).toFixed(2); // 1.00–7.00x
  console.log(`✈️ Round ${round} started — crash at ${crashPoint}x`);
  let multiplier = 1.0;

  const interval = setInterval(() => {
    multiplier += 0.05;
    broadcast({ type: "flight", multiplier: multiplier.toFixed(2) });

    if (multiplier >= crashPoint) {
      clearInterval(interval);
      broadcast({ type: "crash", round, point: parseFloat(crashPoint) });
      console.log(`💥 Round ${round} crashed at ${crashPoint}x`);
      setTimeout(startRound, 3000); // start next round after 3 seconds
    }
  }, 150); // update every 150ms for smooth animation
}

// ✅ Serve the dashboard page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  startRound();
});
