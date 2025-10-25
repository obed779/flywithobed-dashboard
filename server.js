
// server.js
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

// Serve static dashboard from the public folder
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

let round = 2049;
let crashPoint = 0;
let multiplier = 1.0;

function startNewRound() {
  round++;
  crashPoint = (Math.random() * 10 + 1).toFixed(2);
  multiplier = 1.0;
  io.emit("roundStart", { round, target: crashPoint });

  const interval = setInterval(() => {
    multiplier += 0.05;
    io.emit("multiplierUpdate", multiplier.toFixed(2));

    if (multiplier >= crashPoint) {
      clearInterval(interval);
      io.emit("roundCrash", { round, crashPoint });

      setTimeout(() => {
        startNewRound();
      }, 3000);
    }
  }, 200);
}

io.on("connection", (socket) => {
  console.log("🛩️ A player connected");
  socket.emit("status", "✅ Connected to Aviator Live Server");
  socket.on("disconnect", () => console.log("❌ Player disconnected"));
});

server.listen(3000, () => console.log("✅ Server running on port 3000"));
startNewRound();
