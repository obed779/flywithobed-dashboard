
// server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 10000;

// Serve static files from /public
app.use(express.static("public"));

// Fallback route to serve index.html
app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/public/index.html");
});

// Game logic
let multiplier = 1.0;
let crashPoint = 1.0;

function startRound() {
  crashPoint = (Math.random() * 9 + 1).toFixed(2);
  console.log(`🛫 New round started! Crash point: ${crashPoint}x`);

  let interval = setInterval(() => {
    multiplier = (multiplier + 0.05).toFixed(2);
    io.emit("multiplier", multiplier);

    if (multiplier >= crashPoint) {
      clearInterval(interval);
      io.emit("crash", crashPoint);
      console.log(`💥 Crashed at ${crashPoint}x`);
      setTimeout(() => {
        multiplier = 1.0;
        startRound();
      }, 2000);
    }
  }, 200);
}

io.on("connection", (socket) => {
  console.log("🧑‍✈️ A player joined");
  socket.emit("multiplier", multiplier);
});

server.listen(PORT, () => {
  console.log(`✅ FlyWithObed Aviator Game API is live and running on port ${PORT}`);
  startRound();
});




