
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.static(__dirname));

// ===============================
// ✈️ FlyWithObed Aviator Engine
// ===============================
let round = 0;
let isFlying = false;
let balances = { A: 1000, B: 1000 };
let activeBets = {};
let crashPoint = 0;

// Function to start a new round
function startRound() {
  if (isFlying) return;
  isFlying = true;
  round++;
  activeBets = {};

  crashPoint = (Math.random() * 6 + 1).toFixed(2);
  console.log(`✈️ Round ${round} started — will crash at ${crashPoint}x`);

  io.emit("roundStart", { round, multiplier: 1.0 });

  let multiplier = 1.0;
  const flight = setInterval(() => {
    multiplier += 0.05;
    io.emit("flightUpdate", { round, multiplier: multiplier.toFixed(2) });

    if (multiplier >= crashPoint) {
      clearInterval(flight);
      io.emit("roundCrash", { round, crashPoint });
      console.log(`💥 Crashed at ${crashPoint}x`);
      isFlying = false;
      setTimeout(startRound, 5000);
    }
  }, 200);
}

// ===============================
// 🎮 Socket Logic
// ===============================
io.on("connection", (socket) => {
  console.log("✅ Client connected");
  socket.emit("aviator_status", { status: "connected", balances });

  // Bet placing
  socket.on("placeBet", ({ player, bet }) => {
    if (!player || !bet) return;
    if (balances[player] < bet) {
      socket.emit("errorMsg", "❌ Not enough balance!");
      return;
    }
    balances[player] -= bet;
    activeBets[player] = { bet, cashedOut: false };
    io.emit("balanceUpdate", { player, balance: balances[player] });
    console.log(`🎲 Player ${player} bet $${bet}`);
  });

  // Cashout action
  socket.on("cashOut", ({ player }) => {
    const currentMultiplier = Math.min(crashPoint - 0.1, 5.0);
    if (activeBets[player] && !activeBets[player].cashedOut) {
      const { bet } = activeBets[player];
      const winAmount = Math.round(bet * currentMultiplier);
      balances[player] += winAmount;
      activeBets[player].cashedOut = true;
      io.emit("balanceUpdate", { player, balance: balances[player] });
      console.log(`💰 Player ${player} cashed out $${winAmount} at ${currentMultiplier}x`);
    }
  });

  socket.on("disconnect", () => console.log("❌ Client disconnected"));
});

// ===============================
// 🚀 Start Server
// ===============================
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  setTimeout(startRound, 2000);
});


