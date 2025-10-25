
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.send("✅ FlyWithObed Aviator Game API is live and running!");
});

let crashPoint = 1.0;
let flying = false;

function startRound() {
  flying = true;
  crashPoint = (Math.random() * 8 + 1).toFixed(2);
  io.emit("roundStart", { crashPoint });
  console.log(`🎮 New round started! Will crash at: ${crashPoint}`);

  let multiplier = 1.0;
  const interval = setInterval(() => {
    multiplier += 0.05;
    io.emit("multiplierUpdate", multiplier.toFixed(2));

    if (multiplier >= crashPoint) {
      clearInterval(interval);
      flying = false;
      io.emit("roundCrash", crashPoint);
      console.log(`💥 Crashed at ${crashPoint}x`);
      setTimeout(startRound, 3000);
    }
  }, 300);
}

io.on("connection", (socket) => {
  console.log("🧑‍✈️ Player connected");
  socket.emit("connected", { message: "Connected to FlyWithObed Live Aviator" });
});

server.listen(process.env.PORT || 10000, () => {
  console.log("🚀 FlyWithObed Aviator API running on port 10000");
  startRound();
});
