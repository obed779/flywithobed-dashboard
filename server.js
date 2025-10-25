
// server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 10000;

// Serve static dashboard
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// Game state variables
let round = 0;
let multiplier = 1.0;
let crashPoint = 0;
let inProgress = false;

// Start a round automatically
function startRound() {
  round++;
  inProgress = true;
  crashPoint = (Math.random() * 10 + 1).toFixed(2); // Random crash between 1x and 11x
  multiplier = 1.0;

  console.log(`🟢 Round ${round} started (target ${crashPoint}x)`);
  io.emit("roundStart", { round, crashPoint });

  const interval = setInterval(() => {
    multiplier = (parseFloat(multiplier) + 0.05).toFixed(2);
    io.emit("multiplierUpdate", { multiplier });

    if (parseFloat(multiplier) >= parseFloat(crashPoint)) {
      clearInterval(interval);
      inProgress = false;
      console.log(`💥 Round ${round} crashed at ${crashPoint}x`);
      io.emit("roundCrash", { round, crashPoint });
      setTimeout(startRound, 3000); // start next round after 3s
    }
  }, 200);
}

// When a client connects
io.on("connection", (socket) => {
  console.log("🟢 A player connected");

  socket.emit("welcome", {
    message: "✅ FlyWithObed Aviator API is live and running!",
  });

  if (inProgress) {
    socket.emit("roundStart", { round, crashPoint });
    socket.emit("multiplierUpdate", { multiplier });
  } else {
    socket.emit("waiting", { message: "Waiting for next round..." });
  }

  socket.on("disconnect", () => {
    console.log("🔴 A player disconnected");
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  startRound();
});
