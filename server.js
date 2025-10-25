
// server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Setup express and paths
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 10000;
const HISTORY_FILE = path.join(__dirname, "history.json");

// Load history
let history = [];
try {
  if (fs.existsSync(HISTORY_FILE)) {
    const data = fs.readFileSync(HISTORY_FILE, "utf8");
    history = JSON.parse(data) || [];
  }
} catch (err) {
  console.error("⚠️ Error reading history:", err);
}

// Save history
function saveHistory() {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  } catch (err) {
    console.error("⚠️ Error saving history:", err);
  }
}

// Player setup
let players = {
  A: { name: "Player A", balance: 1000, bet: 0, cashoutPoint: null, hasCashedOut: false },
  B: { name: "Player B", balance: 1000, bet: 0, cashoutPoint: null, hasCashedOut: false },
};

let currentRound = 0;
let currentCrashPoint = 0;
let isRunning = false;

// Generate a random bet for simulation
function randomBet(player) {
  const betAmount = Math.floor(Math.random() * 50) + 10; // $10–$60
  const cashout = (Math.random() * 3 + 1.1).toFixed(2); // 1.1x–4.1x
  if (player.balance >= betAmount) {
    player.bet = betAmount;
    player.cashoutPoint = parseFloat(cashout);
    player.balance -= betAmount;
    player.hasCashedOut = false;
    return true;
  }
  return false;
}

// Start new round
function startNewRound() {
  if (isRunning) return;
  isRunning = true;
  currentRound++;

  // Random crash point
  currentCrashPoint = (Math.random() * 9 + 1.01).toFixed(2);
  console.log(`🛫 Round ${currentRound} started (crash at ${currentCrashPoint}x)`);

  // Simulate random bets
  const aBet = randomBet(players.A);
  const bBet = randomBet(players.B);

  io.emit("roundStart", {
    round: currentRound,
    crashPoint: parseFloat(currentCrashPoint),
    players
  });

  const flightDuration = Math.min(currentCrashPoint * 1000, 15000);
  const startTime = Date.now();

  const flight = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    const multiplier = Math.min(1 + elapsed, parseFloat(currentCrashPoint));

    // Handle auto-cashouts
    Object.values(players).forEach(player => {
      if (!player.hasCashedOut && player.bet > 0 && multiplier >= player.cashoutPoint) {
        const win = (player.bet * player.cashoutPoint).toFixed(2);
        player.balance += parseFloat(win);
        player.hasCashedOut = true;
        io.emit("playerCashout", {
          player: player.name,
          win,
          cashout: player.cashoutPoint,
        });
        console.log(`💰 ${player.name} cashed out at ${player.cashoutPoint}x, win $${win}`);
      }
    });
  }, 100);

  // Round end
  setTimeout(() => {
    clearInterval(flight);
    console.log(`💥 Crashed at ${currentCrashPoint}x`);

    // Handle uncashed players
    Object.values(players).forEach(player => {
      if (!player.hasCashedOut && player.bet > 0) {
        player.bet = 0; // lost
      }
    });

    // Save to history
    history.unshift({
      round: currentRound,
      crashPoint: parseFloat(currentCrashPoint),
      A: players.A.balance,
      B: players.B.balance
    });
    if (history.length > 50) history.pop();
    saveHistory();

    io.emit("roundCrash", {
      round: currentRound,
      crashPoint: parseFloat(currentCrashPoint),
      players,
    });

    // Reset bets
    players.A.bet = 0;
    players.B.bet = 0;

    isRunning = false;
    setTimeout(startNewRound, 3000);
  }, flightDuration);
}

// Routes
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "dashboard.html")));
app.get("/history", (req, res) => res.json(history));

// Start server
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log("///////////////////////////////////////////////////////////");
  console.log(`🌍 Live at https://flywithobed-skyhigh.onrender.com`);
  console.log("///////////////////////////////////////////////////////////");
  startNewRound();
});

// Sockets
io.on("connection", (socket) => {
  console.log("🟢 New player connected");

  // Send live status + balances
  socket.emit("historyData", history);
  socket.emit("playersData", players);

  if (isRunning) {
    socket.emit("roundStart", {
      round: currentRound,
      crashPoint: parseFloat(currentCrashPoint),
      players,
    });
  }

  socket.on("disconnect", () => console.log("🔴 Player disconnected"));
});
