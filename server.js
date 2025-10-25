
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

// Serve files from "public"
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

let multiplier = 1.0;

function startRound() {
  multiplier = 1.0;
  const crashPoint = (Math.random() * 8 + 1).toFixed(2);
  console.log(`🛫 Round started. Crash at ${crashPoint}x`);

  const interval = setInterval(() => {
    multiplier += 0.05;
    io.emit("multiplier", multiplier.toFixed(2));

    if (multiplier >= crashPoint) {
      clearInterval(interval);
      io.emit("crash", crashPoint);
      console.log(`💥 Crashed at ${crashPoint}x`);
      setTimeout(startRound, 3000);
    }
  }, 300);
}

io.on("connection", (socket) => {
  console.log("👨‍✈️ Player connected");
  socket.emit("message", "Connected to Aviator Live Server");
});

server.listen(10000, () => {
  console.log("✅ FlyWithObed Aviator Game API is live and running on port 10000!");
  startRound();
});


