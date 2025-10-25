
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from "public" folder
app.use(express.static(path.join(__dirname, "public")));

// Route for main dashboard page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Aviator live multiplier
let currentMultiplier = 1.00;
let gameRunning = false;

function startRound() {
  gameRunning = true;
  currentMultiplier = 1.00;
  io.emit("game_start");

  const growth = setInterval(() => {
    currentMultiplier += Math.random() * 0.2;
    io.emit("multiplier_update", currentMultiplier.toFixed(2));

    if (Math.random() < 0.02) {
      clearInterval(growth);
      gameRunning = false;
      io.emit("game_crash", currentMultiplier.toFixed(2));

      setTimeout(() => startRound(), 3000);
    }
  }, 200);
}

io.on("connection", (socket) => {
  console.log("✅ Player connected");
  socket.emit("multiplier_update", currentMultiplier.toFixed(2));
});

startRound();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`✅ FlyWithObed Aviator Game API is live and running on port ${PORT}!`)
);
