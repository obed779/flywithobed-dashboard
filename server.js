

const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 10000;

// Serve static files from "public"
app.use(express.static(path.join(__dirname, "public")));

// Route to dashboard.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// Start the Aviator game simulation
let round = 1;
function startRound() {
  const crashPoint = (Math.random() * 10 + 1).toFixed(2);
  console.log(`🛫 Round ${round} started (crash at ${crashPoint}x)`);
  round++;
}
setInterval(startRound, 10000); // simulate every 10 seconds

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
