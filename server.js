
// server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Setup Express and paths
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Allow all CORS (for browser sockets)
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // serve dashboard.html and assets

// Create server and socket
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 10000;
const HISTORY_FILE = path.join(__dirname, "history.json");

// Load existing history from file
let history = [];
try {
  if (fs.existsSync(HISTORY_FILE)) {
    const data = fs.readFileSync(HISTORY_FILE, "utf-8");
    history = JSON.parse(data) || [];
  }
} catch (err) {
  console.error("⚠️ Failed to load history file:", err);
}

// Function to save history to file
function saveHistory() {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  } catch (err) {
    console.error("⚠️ Failed to save history:", err);
  }
}

let currentRound = 0;
let currentCrashPoint = 0;
let isRunning = false;

// Start a new round
function startNewRound() {
  if (isRunning) return;
  isRunning = true;
  currentRound++;

  // Random crash point between 1.01x and 10x
  currentCrashPoint = (Math.random() * 9 + 1.01).toFixed(2);

  console.log(`🛫 Round ${currentRound} started (crash at ${currentCrashPoint}x)`);

  io.emit("roundStart", {
    round: currentRound,
    crashPoint: parseFloat(currentCrashPoint)
  });

  // Simulate duration of flight (max 15 seconds)
  const flightDuration = Math.min(currentCrashPoint * 1000, 15000);

  setTimeout(() => {
    console.log(`💥 Crashed at ${currentCrashPoint}x`);
    io.emit("roundCrash", {
      round: currentRound,
      crashPoint: parseFloat(currentCrashPoint)
    });

    // Save to history file
    history.unshift({
      round: currentRound,
      crashPoint: parseFloat(currentCrashPoint)
    });
    if (history.length > 50) history.pop();
    saveHistory();

    isRunning = false;
    setTimeout(startNewRound, 3000);
  }, flightDuration);
}

// Route: Serve dashboard
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "dashboard.html"));
});

// Route: Serve history as JSON
app.get("/history", (req, res) => {
  res.json(history);
});

// Start server
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log("///////////////////////////////////////////////////////////");
  console.log(`🌍 Live at https://flywithobed-skyhigh.onrender.com`);
  console.log("///////////////////////////////////////////////////////////");
  startNewRound();
});

// Handle socket connections
io.on("connection", (socket) => {
  console.log("🟢 New player connected");

  // Send current round status
  if (isRunning) {
    socket.emit("roundStart", {
      round: currentRound,
      crashPoint: parseFloat(currentCrashPoint)
    });
  }

  // Send history data
  socket.emit("historyData", history);

  socket.on("disconnect", () => {
    console.log("🔴 Player disconnected");
  });
});
