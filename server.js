
import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend files
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// Game state
let round = 2050;
let crashPoint = 0;
let planeMultiplier = 1.0;
let isFlying = false;

let players = {
  A: { balance: 1000, bet: 0, cashedOut: false },
  B: { balance: 1000, bet: 0, cashedOut: false },
};

function startNewRound() {
  isFlying = true;
  crashPoint = (Math.random() * 10 + 1).toFixed(2);
  round++;
  planeMultiplier = 1.0;

  for (const key in players) {
    players[key].bet = 0;
    players[key].cashedOut = false;
  }

  io.emit("roundStart", { round, target: crashPoint, players });

  const interval = setInterval(() => {
    planeMultiplier += 0.05;
    io.emit("multiplierUpdate", planeMultiplier.toFixed(2));

    if (planeMultiplier >= crashPoint) {
      clearInterval(interval);
      io.emit("roundCrash", { round, crashPoint });
      isFlying = false;
      setTimeout(() => startNewRound(), 3000);
    }
  }, 200);
}

io.on("connection", (socket) => {
  console.log("🛩️ Player connected");

  socket.emit("status", "Connected to FlyWithObed Live Server ✈️");
  socket.emit("playerData", players);

  socket.on("placeBet", ({ player, amount }) => {
    if (!isFlying && players[player].balance >= amount) {
      players[player].bet = amount;
      players[player].balance -= amount;
      io.emit("playerUpdate", players);
    }
  });

  socket.on("cashOut", (player) => {
    if (isFlying && !players[player].cashedOut && players[player].bet > 0) {
      const payout = players[player].bet * planeMultiplier;
      players[player].balance += payout;
      players[player].cashedOut = true;
      io.emit("playerUpdate", players);
    }
  });

  socket.on("disconnect", () => console.log("Player disconnected"));
});

server.listen(3000, () => console.log("✅ Server running on port 3000"));
startNewRound();
