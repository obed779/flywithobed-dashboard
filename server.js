
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

app.use(cors());
app.get("/", (req, res) => res.send("✅ FlyWithObed Aviator API is live and running!"));

let round = 2045;

function startRound() {
  let multiplier = 1.0;
  const crashPoint = (Math.random() * 10 + 1).toFixed(2);
  io.emit("roundStart", { round, crashPoint });
  console.log(`🟢 Round ${round} started (target ${crashPoint}x)`);

  const interval = setInterval(() => {
    multiplier += 0.05;
    io.emit("multiplierUpdate", { multiplier: multiplier.toFixed(2) });

    if (multiplier >= crashPoint) {
      clearInterval(interval);
      io.emit("roundCrash", { crashPoint });
      console.log(`💥 Round ${round} crashed at ${crashPoint}x`);
      round++;
      setTimeout(startRound, 3000);
    }
  }, 100);
}

io.on("connection", (socket) => {
  console.log("🧑‍✈️ Player connected");
  socket.emit("connected", "Connected to FlyWithObed Aviator Live");
});

server.listen(10000, () => {
  console.log("🚀 FlyWithObed Aviator Live Server running on port 10000");
  startRound();
});

  
