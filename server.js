
import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

const PORT = process.env.PORT || 10000;

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Default route
app.get("/", (req, res) => {
  res.send("✅ FlyWithObed Aviator Game API is live and running!");
});

// Game variables
let currentMultiplier = 1.0;
let crashPoint = randomCrash();
let flying = false;

function randomCrash() {
  return (Math.random() * 9 + 1).toFixed(2); // 1.00x - 10.00x
}

function startRound() {
  flying = true;
  currentMultiplier = 1.0;
  crashPoint = randomCrash();
  io.emit("roundStart", { crashPoint });

  const flight = setInterval(() => {
    currentMultiplier += 0.05;
    io.emit("multiplierUpdate", currentMultiplier.toFixed(2));

    if (currentMultiplier >= crashPoint) {
      clearInterval(flight);
      flying = false;
      io.emit("roundCrash", crashPoint);
      setTimeout(startRound, 4000);
    }
  }, 200);
}

io.on("connection", (socket) => {
  console.log("🟢 Player connected:", socket.id);
  socket.emit("connected", { message: "Connected to FlyWithObed" });

  if (!flying) startRound();

  socket.on("disconnect", () => {
    console.log("🔴 Player disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 FlyWithObed Aviator API running on port ${PORT}`);
});
