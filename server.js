
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

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

let round = 1;
let multiplier = 1.0;
let target = randomTarget();
let running = false;

function randomTarget() {
  return (Math.random() * 9 + 1).toFixed(2);
}

function startRound() {
  if (running) return;
  running = true;
  target = randomTarget();
  multiplier = 1.0;
  console.log(`🟢 Round ${round} started (target ${target}x)`);
  io.emit("roundStart", { round, target });

  const interval = setInterval(() => {
    multiplier = parseFloat((multiplier + 0.05).toFixed(2));
    io.emit("multiplierUpdate", { multiplier });

    if (multiplier >= target) {
      clearInterval(interval);
      console.log(`💥 Round ${round} crashed at ${target}x`);
      io.emit("roundCrash", { round, crashPoint: target });
      running = false;
      round++;
      setTimeout(startRound, 3000);
    }
  }, 200);
}

io.on("connection", (socket) => {
  console.log("✈️ New user connected");
  socket.emit("welcome", { message: "Connected to FlyWithObed Live Aviator!" });
});

server.listen(10000, () => {
  console.log("✅ Server running on port 10000");
  startRound();
});
