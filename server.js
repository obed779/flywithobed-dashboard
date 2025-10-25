
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

let multiplier = 1.0;

setInterval(() => {
  multiplier = (Math.random() * 10).toFixed(2);
  io.emit("multiplier", multiplier);
  console.log("🛫 Round started at " + multiplier + "x");
}, 5000);

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
