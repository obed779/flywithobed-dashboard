
// server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.static(__dirname));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 10000;

// === Game Variables ===
let currentRound = 0;
let currentCrashPoint = 0;
let isRunning = false;

// === Load history or create empty ===
const historyFile = path.join(__dirname, "history.json");
let history = [];

if (fs.existsSync(historyFile)) {
  try {
    const data = fs.readFileSync(historyFile);
    history = JSON.parse(data);
    console.log(`📜 Loaded ${history.length} previous rounds`);
  } catch (err) {
    console.error("⚠️ Failed to load history file:", err);
    history = [];
  }
} else {
  fs.writeFileSync(historyFile, JSON.stringify([]));
}

// === Function to save new round to history ===
function saveHistory(round, crashPoint) {
  const entry = { round, crashPoint, time: new Date().toISOString() };
  history.unshift(entry); // add to start
  if (history.length > 30) history.pop(); // keep latest 30 rounds

  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
  console.log(`💾 Saved round ${round} (crash: ${crashPoint}x)`);
}

// === Game Round Logic ===
function startNewRound() {
  if (isRunning) return;
  isRunning = true;
  currentRound++;

  // Random crash point between 1.01x and 10x
  currentCrashPoint = (Math.random() * 9 + 1.01).toFixed(2);

  console.log(`🛫 Round ${currentRound} started (crash at ${currentCrashPoint}x)`);
  io.emit("roundStart", { round: currentRound, crashPoint: parseFloat(currentCrashPoint) });

  // Duration proportional to crash point
  const flightDuration = Math.min(currentCrashPoint * 1000, 15000);

  setTimeout(() => {
    console.log(`💥 Crashed at ${currentCrashPoint}x`);
    io.emit("roundCrash", { round: currentRound, crashPoint: parseFloat(currentCrashPoint) });

    // Save round data
    saveHistory(currentRound, parseFloat(currentCrashPoint));

    isRunning = false;
    setTimeout(startNewRound, 3000); // Next round after 3s
  }, flightDuration);
}

// === API Endpoint for History ===
app.get("/history", (req, res) => {
  res.json(history);
});

// === Serve dashboard ===
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "dashboard.html"));
});

// === Start Server ===
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log("///////////////////////////////////////////////////////////");
  console.log(`🌍 Live at https://flywithobed-skyhigh.onrender.com`);
  console.log("///////////////////////////////////////////////////////////");
  startNewRound();
});

// === Socket Connections ===
io.on("connection", (socket) => {
  console.log("🟢 New player connected");

  // Send history immediately
  socket.emit("historyData", history);

  // Send current round if active
  if (isRunning) {
    socket.emit("roundStart", { round: currentRound, crashPoint: parseFloat(currentCrashPoint) });
  }

  socket.on("disconnect", () => {
    console.log("🔴 Player disconnected");
  });
});
