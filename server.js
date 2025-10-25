
// server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// Serve all static files from /public and root
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(__dirname));

// Root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Explicit route for dashboard.html
app.get("/dashboard.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// Example live message (for confirmation)
app.get("/api/status", (req, res) => {
  res.json({ message: "✅ FlyWithObed Aviator Game API is live and running!" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 FlyWithObed Aviator API running on port ${PORT}`);
});

