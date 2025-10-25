
// server.js
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 10000;

// serve static frontend files
app.use(express.static(path.join(__dirname, "public")));

// serve dashboard
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// Aviator game simulation
let round = 0;

function startNewRound() {
  round++;
  const target = (Math.random() * 10 + 1).toFixed(2);
  console.log(`🟢 Round ${round} started (target ${target}x)`);

  // broadcast start of new round
  broadcast(`🟢 Round ${round} started — target ${target}x`);

  setTimeout(() => {
    console.log(`💥 Round ${round} crashed at ${target}x`);
    broadcast(`💥 Crashed at ${target}x`);
    setTimeout(startNewRound, 4000);
  }, 5000);
}

function broadcast(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// start simulation loop
startNewRound();

// handle WebSocket connections
wss.on("connection", (ws) => {
  console.log("👨‍✈️ New dashboard connected");
  ws.send("✅ Connected to FlyWithObed Aviator API");
});

// start server
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
