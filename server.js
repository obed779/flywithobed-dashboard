
const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 10000;

// Serve static files (like CSS, JS, images)
app.use(express.static(path.join(__dirname, "public")));

// Serve the main dashboard file (index.html)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Simple Aviator logic simulation (optional)
let round = 1;
setInterval(() => {
  const crash = (Math.random() * 10).toFixed(2);
  console.log(`🛫 Round ${round} started (crash at ${crash}x)`);
  setTimeout(() => console.log(`💥 Crashed at ${crash}x`), 3000);
  round++;
}, 7000);

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

