
// server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.static(__dirname)); // serve dashboard.html and assets

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 10000;

let currentRound = 0;
let currentCrashPoint = 0;
let isRunning = false;

// Function to start rounds
function startNewRound() {
  if (isRunning) return;
  isRunning = true;
  currentRound++;
  
  // Random crash point between 1.01x and 10x
  currentCrashPoint = (Math.random() * 9 + 1.01).toFixed(2);

  console.log(`🛫 Round ${currentRound} started (crash at ${currentCrashPoint}x)`);
  io.emit("roundStart", { round: currentRound, crashPoint: parseFloat(currentCrashPoint) });

  // Simulate duration of flight
  const flightDuration = Math.min(currentCrashPoint * 1000, 15000);

  setTimeout(() => {
    console.log(`💥 Crashed at ${currentCrashPoint}x`);
    io.emit("roundCrash", { round: currentRound, crashPoint: parseFloat(currentCrashPoint) });
    isRunning = false;

    // Start next round after 3 seconds
    setTimeout(startNewRound, 3000);
  }, flightDuration);
}

// Serve dashboard.html when visiting /
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "dashboard.html"));
});

// Start the server
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log("///////////////////////////////////////////////////////////");
  console.log(`🌍 Live at https://flywithobed-skyhigh.onrender.com`);
  console.log("///////////////////////////////////////////////////////////");
  startNewRound();
});

// Handle new socket connections
io.on("connection", (socket) => {
  console.log("🟢 New player connected");

  // Send current round status immediately
  if (isRunning) {
    socket.emit("roundStart", { round: currentRound, crashPoint: parseFloat(currentCrashPoint) });
  }

  socket.on("disconnect", () => {
    console.log("🔴 Player disconnected");
  });
});



