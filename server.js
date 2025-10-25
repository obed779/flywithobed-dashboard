
// ===============================
// ✈️ FlyWithObed Aviator Backend
// ===============================
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // allow dashboard connection
  },
});

app.use(cors());
app.use(express.json());

let round = 0;
let isFlying = false;
let multiplier = 1.0;
let playerBalances = { A: 1000, B: 1000 };
let history = [];

// Serve base API message
app.get("/", (req, res) => {
  res.send("✅ FlyWithObed Aviator Game API is live and running!");
});

// ============= SOCKET HANDLING =============
io.on("connection", (socket) => {
  console.log("🟢 Player connected:", socket.id);

  // Send initialization data
  socket.emit("balanceUpdate", { player: "A", balance: playerBalances.A });
  socket.emit("balanceUpdate", { player: "B", balance: playerBalances.B });

  // Send past history
  history.slice(-10).forEach((h) => {
    socket.emit("roundEnd", h);
  });

  // Chat message handler
  socket.on("chatMessage", (msg) => {
    const fullMsg = `💬 ${socket.id.slice(0, 4)}: ${msg}`;
    io.emit("chatMessage", fullMsg);
  });

  // Betting
  socket.on("bet", (data) => {
    const { player, amount } = data;
    if (!isFlying && playerBalances[player] >= amount) {
      playerBalances[player] -= amount;
      io.emit("balanceUpdate", { player, balance: playerBalances[player] });
      io.emit("chatMessage", `🎲 Player ${player} bet $${amount}`);
      socket.data.bet = { player, amount, active: true, cashout: null };
    }
  });

  // Cashout
  socket.on("cashout", (data) => {
    const { player } = data;
    if (isFlying && socket.data.bet && socket.data.bet.active) {
      const win = socket.data.bet.amount * multiplier;
      playerBalances[player] += win;
      socket.data.bet.active = false;
      io.emit("balanceUpdate", { player, balance: playerBalances[player] });
      io.emit(
        "chatMessage",
        `💰 Player ${player} cashed out at ${multiplier.toFixed(2)}x and won $${win.toFixed(2)}`
      );
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 Player disconnected:", socket.id);
  });
});

// ============= GAME LOOP =============
function startRound() {
  if (isFlying) return;

  round++;
  multiplier = 1.0;
  isFlying = true;

  io.emit("roundStart", { round });
  io.emit("chatMessage", `🛫 Round ${round} started — flying...`);

  const growth = setInterval(() => {
    if (!isFlying) return clearInterval(growth);
    multiplier += Math.random() * 0.1 + 0.02; // gradual growth

    io.emit("roundUpdate", { multiplier });

    // Random crash condition
    if (multiplier >= Math.random() * 8 + 1) {
      clearInterval(growth);
      const crashPoint = parseFloat(multiplier.toFixed(2));
      isFlying = false;

      io.emit("roundEnd", { round, crashPoint });
      io.emit("chatMessage", `💥 Round ${round} crashed at ${crashPoint}x`);
      history.push({ round, crashPoint });
      if (history.length > 50) history.shift();

      setTimeout(startRound, 4000); // wait 4s before next round
    }
  }, 300);
}

startRound();

// ============= START SERVER =============
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 FlyWithObed Aviator API running on port ${PORT}`);
});
