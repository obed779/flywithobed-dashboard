
// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());

// Root route
app.get("/", (req, res) => {
  res.send("✅ FlyWithObed Aviator Game API is live and running!");
});

// --- Game Logic Variables ---
let crashPoint = 1.0;
let multiplier = 1.0;
let inRound = false;
let history = [];
let players = {}; // Track balances and bets

// --- Helper Functions ---
function generateCrashPoint() {
  // Randomly generate crash point between 1.00x - 10.00x
  let r = Math.random();
  if (r < 0.01) return 1.0;
  return parseFloat((1 / (1 - r)).toFixed(2));
}

function startNewRound() {
  inRound = true;
  multiplier = 1.0;
  crashPoint = generateCrashPoint();

  io.emit("roundStart", { message: "✈️ Plane is taking off!", crashPoint });

  const flight = setInterval(() => {
    multiplier += 0.01;

    // Send live multiplier updates
    io.emit("multiplierUpdate", { multiplier: multiplier.toFixed(2) });

    // Crash condition
    if (multiplier >= crashPoint) {
      clearInterval(flight);
      inRound = false;
      history.unshift({ crashPoint: crashPoint.toFixed(2) });
      if (history.length > 10) history.pop();

      io.emit("roundEnd", {
        message: `💥 Plane crashed at ${crashPoint.toFixed(2)}x`,
        history
      });

      // Start new round after 5 seconds
      setTimeout(startNewRound, 5000);
    }
  }, 100); // updates every 100ms
}

// --- Socket.IO Events ---
io.on("connection", (socket) => {
  console.log(`🟢 New player connected: ${socket.id}`);

  // Initialize player balance
  players[socket.id] = { balance: 1000, bet: 0, cashout: null };

  socket.emit("connected", {
    message: "Welcome to FlyWithObed Aviator!",
    balance: players[socket.id].balance,
    history
  });

  // Handle new bet
  socket.on("placeBet", (amount) => {
    const player = players[socket.id];
    if (!inRound && player.balance >= amount) {
      player.balance -= amount;
      player.bet = amount;
      socket.emit("betConfirmed", { bet: amount, balance: player.balance });
      io.emit("betPlaced", { playerId: socket.id, amount });
    }
  });

  // Handle manual cashout
  socket.on("cashout", () => {
    const player = players[socket.id];
    if (inRound && player.bet > 0) {
      const winnings = player.bet * multiplier;
      player.balance += winnings;
      player.bet = 0;
      player.cashout = multiplier;
      socket.emit("cashedOut", {
        winnings: winnings.toFixed(2),
        balance: player.balance
      });
    }
  });

  socket.on("disconnect", () => {
    console.log(`🔴 Player disconnected: ${socket.id}`);
    delete players[socket.id];
  });
});

// --- Start the first game round ---
setTimeout(startNewRound, 3000);

// --- Start Server ---
server.listen(PORT, () => {
  console.log(`🚀 FlyWithObed Aviator API running on port ${PORT}`);
});

